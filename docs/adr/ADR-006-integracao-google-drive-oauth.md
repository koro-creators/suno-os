# ADR-006: Integração Google Drive — Per-Operator OAuth com Backend Proxy

**Status:** Proposto
**Data:** 2026-05-14
**Decisores:** Heitor Miranda (Inovação), José Lucas (Tech Lead)
**Contexto Técnico:** sunOS — Next.js 14 + FastAPI + Cloud Run (stateless)

---

## Contexto

### Clientes entregam documentos via Google Drive

Clientes como Vivo, Americanas, Sicredi e Samsung entregam materiais estratégicos via Google Drive:
brand books, briefings de campanha, planilhas de budget, decks de apresentação, gravações de reunião.
O ciclo atual — download manual → upload na Biblioteca — adiciona fricção e aumenta risco de versões
desatualizadas sendo indexadas.

O objetivo é: operador cola um link do Drive no chat ou na Biblioteca e o sunOS baixa, extrai e indexa automaticamente.

### Cloud Run é stateless

O backend roda em Cloud Run, que reinicia quando escala para zero ou recebe nova versão.
Tokens persistidos em disco ou memória de processo se perdem nesses eventos.
Além disso, o sunOS serve múltiplos operadores — tokens precisam ser por sessão, não por instância.

---

## Opções Consideradas

### Opção 1: GoogleDriveLoader (langchain-google-community)
- **Prós:** integração LangChain nativa
- **Contras:** exige browser para consent flow — incompatível com Cloud Run; token persistido em disco (stateful)

### Opção 2: Service Account com Domain-Wide Delegation
- **Prós:** sem interação do usuário; token gerenciado pelo GCP
- **Contras:** requer Google Workspace Admin; SA tem acesso a TODO Drive de todos os usuários

### Opção 3: Service Account + compartilhamento manual
- **Prós:** permissão granular por arquivo
- **Contras:** uma ação manual adicional por arquivo; não melhora o fluxo atual

### Opção 4: Per-Operator OAuth → access_token → backend proxy via httpx (escolhida)

Frontend autentica o operador via Google OAuth 2.0 (popup), obtém `access_token` de curta duração
e o passa junto com o `file_id` ao backend. O backend baixa o arquivo via `httpx` usando o token como Bearer header.

- **Prós:** stateless por design; por operador; sem G Workspace Admin; scope readonly; padrão já validado internamente (videorag-api)
- **Contras:** reautenticação após 1h; nova UI para OAuth flow no frontend

---

## Decisão

Adotar **per-operator OAuth com `access_token` de sessão e backend proxy via `httpx`**.

### Fluxo completo

```
FRONTEND (Next.js)                    BACKEND (FastAPI)
    |                                      |
    | 1. Operador clica 'Conectar Drive'   |
    | Google OAuth popup                   |
    | scope: drive.readonly                |
    | <-- access_token (expira em 1h) --   |
    |                                      |
    | 2. Operador cola URL do Drive        |
    |    na Biblioteca ou no chat          |
    |                                      |
    | 3. Frontend extrai file_id da URL    |
    |    POST /api/biblioteca/ingest-drive |
    |    {file_id, access_token,           |
    |     client_slug, scope, tags}        |
    | -----------------------------------> |
    |                                      |
    |                        4. httpx GET Drive API
    |                           Authorization: Bearer <token>
    |                           --> bytes do arquivo
    |                                      |
    |                        5. detect_source_type(filename)
    |                           extract(bytes) -> texto
    |                           chunk(texto, source_type)
    |                           index(chunks, client_slug)
    |                                      |
    | <-- {doc_id, chunks, filename} ----- |
```

### Suporte a formatos Google-native

Arquivos nativos do Google precisam de export antes do download:

| Tipo Google | Export MIME | Extensão | Extractor |
|-------------|-------------|----------|-----------|
| Google Docs | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx | extract_docx |
| Google Sheets | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | .xlsx | extract_xlsx |
| Slides, outros | — | — | não suportado nesta versão |

### Implementação da tool

```python
# api/chat/tools/drive_tools.py
import httpx
from pathlib import Path

GOOGLE_NATIVE_EXPORTS = {
    "application/vnd.google-apps.document": (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".docx",
    ),
    "application/vnd.google-apps.spreadsheet": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xlsx",
    ),
}

async def download_drive_file(access_token: str, file_id: str, dest_dir: Path) -> Path:
    headers = {"Authorization": f"Bearer {access_token}"}
    base_url = f'https://www.googleapis.com/drive/v3/files/{file_id}'
    async with httpx.AsyncClient() as client:
        meta = (await client.get(
            base_url, headers=headers,
            params={"fields": "id,name,mimeType,size"},
        )).raise_for_status().json()
        mime, filename = meta['mimeType'], meta['name']
        if mime in GOOGLE_NATIVE_EXPORTS:
            export_mime, ext = GOOGLE_NATIVE_EXPORTS[mime]
            resp = await client.get(
                base_url + '/export', headers=headers,
                params={"mimeType": export_mime},
            )
            filename = Path(filename).stem + ext
        else:
            resp = await client.get(
                base_url, headers=headers, params={"alt": "media"},
            )
        resp.raise_for_status()
    dest_path = dest_dir / filename
    dest_path.write_bytes(resp.content)
    return dest_path


# api/workflows/router.py ou api/chat/router.py
# Endpoint de ingestão
@router.post('/biblioteca/ingest-drive')
async def ingest_from_drive(req: DriveIngestRequest):
    try:
        import tempfile, shutil
        dest = Path(tempfile.mkdtemp(prefix=f'suno-drive-{req.client_slug}-'))
        raw_path = await download_drive_file(
            req.access_token, req.file_id, dest
        )
        source_type = detect_source_type(raw_path)
        text = EXTRACTORS[raw_path.suffix.lower()](raw_path)
        chunks = chunk_document(text, source_type)
        _enrich_chunks(chunks, req.client_slug, source_type, req.scope, req.tags)
        result = await index_document(str(req.file_id), req.client_slug, chunks)
        return {'doc_id': req.file_id, 'chunks': result['num_added'], 'filename': raw_path.name}
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(401, detail="DRIVE_TOKEN_EXPIRED")
        raise
    finally:
        shutil.rmtree(dest, ignore_errors=True)
```

### Extração de file_id no frontend

```typescript
// components/biblioteca/DriveIngest.tsx
function extractFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}
```

---

## Consequências

### Positivas
- Stateless por design: token não persiste no servidor
- Por operador: cada um autentica com sua conta Google
- Reutiliza pipeline ADR-004 (extractor) + ADR-003 (indexador) sem alteração
- Scope `drive.readonly`: impossível escrita no Drive mesmo com bug
- Arquivo temporário em `/tmp` removido ao final (bloco `finally`)

### Negativas
- Reautenticação após 1h — ingest de pastas grandes pode exigir reautenticação
- Nova UI: componente `DriveIngest` + botão `DriveAuthButton` no frontend
- Google Slides não suportado nesta versão
- Sem re-ingest automático quando o arquivo é atualizado no Drive

### Neutras
- `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` adicionada ao `.env.local`
- Endpoint separado `/api/biblioteca/ingest-drive` — não altera o endpoint de upload existente

---

## Referências

- koro-agent ADR-015: Integração Google Drive per-operator OAuth — modelo de referência adaptado
- ADR-003: RAG PostgreSQL + pgvector — pipeline de indexação que esta decisão alimenta
- ADR-004: Pipeline de Extração de Binários — extractor reutilizado após download
- [Google Drive API v3 — Files: get](https://developers.google.com/drive/api/v3/reference/files/get)
- [Google Drive API v3 — Files: export](https://developers.google.com/drive/api/v3/reference/files/export)
- [Google OAuth 2.0 para aplicações client-side](https://developers.google.com/identity/oauth2/web/guides/use-token-model)