"""Cliente do Google Drive via service account (recorte da SPEC-006).

Modelo "Drive da Suno, pasta por cliente": o admin compartilha a pasta do
cliente com a service account do Cloud Run (Leitor) e cola a URL na aba Drive
do editor do cliente. Sem OAuth por usuário, sem tokens armazenados.

Acesso via ADC (google-auth, dependência transitiva do firebase-admin) +
httpx contra a REST API do Drive — nenhuma dependência nova (CLAUDE.md).

Erros de acesso viram ``DriveAccessError`` com motivo legível; o router decide
o status HTTP.
"""

from __future__ import annotations

import logging
import re

import httpx

logger = logging.getLogger(__name__)

DRIVE_API = "https://www.googleapis.com/drive/v3"
DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"

# Limite de arquivos por sync (MVP, sem job queue). O router reporta
# `truncated=true` quando a pasta tem mais que isso — nunca truncar em silêncio.
MAX_FILES_PER_SYNC = 50

# Google Workspace files exportáveis como texto. Demais tipos: só texto puro
# (text/*) é baixado; binários (pdf, imagens, vídeos) são pulados no MVP.
_EXPORT_MIME = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

_FOLDER_MIME = "application/vnd.google-apps.folder"

# Cap de conteúdo por documento (o texto vai inteiro no contexto do chat).
MAX_CONTENT_CHARS = 50_000


class DriveAccessError(Exception):
    """Falha de acesso ao Drive (sem permissão, pasta inexistente, API off)."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def extract_folder_id(url_or_id: str) -> str | None:
    """Extrai o ID da pasta de uma URL do Drive (ou aceita o ID puro).

    Formatos aceitos:
      https://drive.google.com/drive/folders/<id>
      https://drive.google.com/drive/u/0/folders/<id>?usp=...
      <id puro>
    """
    value = (url_or_id or "").strip()
    if not value:
        return None
    m = re.search(r"/folders/([A-Za-z0-9_-]+)", value)
    if m:
        return m.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{10,}", value):
        return value
    return None


def _get_access_token() -> str:
    """Token OAuth da identidade do serviço (ADC) com escopo drive.readonly."""
    import google.auth
    import google.auth.transport.requests

    try:
        credentials, _ = google.auth.default(scopes=[DRIVE_SCOPE])
        credentials.refresh(google.auth.transport.requests.Request())
        return credentials.token
    except Exception as exc:
        logger.warning("Drive: falha ao obter credenciais ADC: %s", exc)
        raise DriveAccessError(
            "Credenciais do serviço indisponíveis (ADC). Em dev local, rode "
            "`gcloud auth application-default login`."
        ) from exc


def _drive_get(path: str, params: dict) -> dict:
    token = _get_access_token()
    resp = httpx.get(
        f"{DRIVE_API}{path}",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    if resp.status_code in (403, 404):
        # 404 também cobre "sem acesso" (Drive não revela existência — mesma
        # filosofia caixa-preta que usamos).
        raise DriveAccessError(
            "Pasta não encontrada ou sem acesso. Confirme que a pasta foi "
            "compartilhada com a service account como Leitor."
        )
    resp.raise_for_status()
    return resp.json()


def _drive_get_raw(path: str, params: dict) -> str:
    token = _get_access_token()
    resp = httpx.get(
        f"{DRIVE_API}{path}",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.text


def get_folder(folder_id: str) -> dict:
    """Valida acesso e retorna {id, name} da pasta. DriveAccessError se não der."""
    data = _drive_get(
        f"/files/{folder_id}",
        {"fields": "id,name,mimeType", "supportsAllDrives": "true"},
    )
    if data.get("mimeType") != _FOLDER_MIME:
        raise DriveAccessError("O link informado não é uma pasta do Drive.")
    return {"id": data["id"], "name": data["name"]}


def list_folder_files(
    folder_id: str, max_files: int = MAX_FILES_PER_SYNC
) -> tuple[list[dict], bool]:
    """Lista arquivos (não-pasta) da pasta. Retorna (files, truncated).

    Cada file: {id, name, mimeType, modifiedTime, size?, webViewLink}.
    Inclui Shared Drives (supportsAllDrives).
    """
    files: list[dict] = []
    page_token: str | None = None
    truncated = False

    while True:
        params = {
            "q": f"'{folder_id}' in parents and trashed=false",
            "fields": "nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink)",
            "pageSize": 100,
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
            "corpora": "allDrives",
        }
        if page_token:
            params["pageToken"] = page_token

        data = _drive_get("/files", params)
        for f in data.get("files", []):
            if f.get("mimeType") == _FOLDER_MIME:
                continue  # MVP: sem recursão em subpastas
            files.append(f)
            if len(files) >= max_files:
                truncated = bool(data.get("nextPageToken")) or len(data.get("files", [])) > 0
                return files, truncated

        page_token = data.get("nextPageToken")
        if not page_token:
            return files, truncated


def fetch_file_text(file: dict) -> str | None:
    """Extrai o texto de um arquivo, ou None se o tipo não é suportado (MVP).

    Google Docs/Sheets/Slides → export como texto; text/* e JSON → download
    direto; binários (pdf, imagem, vídeo) → None (entram só como metadata).
    """
    file_id = file["id"]
    mime = file.get("mimeType", "")

    try:
        if mime in _EXPORT_MIME:
            text = _drive_get_raw(
                f"/files/{file_id}/export",
                {"mimeType": _EXPORT_MIME[mime]},
            )
        elif mime.startswith("text/") or mime == "application/json":
            text = _drive_get_raw(
                f"/files/{file_id}",
                {"alt": "media", "supportsAllDrives": "true"},
            )
        else:
            return None
    except httpx.HTTPStatusError as exc:
        logger.warning("Drive: falha ao baixar %s (%s): %s", file.get("name"), mime, exc)
        return None

    text = text.strip()
    if len(text) > MAX_CONTENT_CHARS:
        text = text[:MAX_CONTENT_CHARS] + "\n\n[conteúdo truncado na sincronização]"
    return text or None


def file_type_label(mime: str) -> str:
    """Mapeia mimeType para o file_type curto usado em knowledge_documents."""
    if mime == "application/vnd.google-apps.document":
        return "gdoc"
    if mime == "application/vnd.google-apps.spreadsheet":
        return "gsheet"
    if mime == "application/vnd.google-apps.presentation":
        return "gslides"
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("text/"):
        return "txt"
    return "file"
