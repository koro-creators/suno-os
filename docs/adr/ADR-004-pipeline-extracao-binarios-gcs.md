# ADR-004: Pipeline de Extração de Binários — GCS → Texto Normalizado

**Status:** Proposto
**Data:** 2026-05-14
**Decisores:** Heitor Miranda (Inovação), José Lucas (Tech Lead)
**Contexto Técnico:** sunOS — FastAPI + Cloud Run + GCS (southamerica-east1) + Vertex AI STT

---

## Contexto

### A Biblioteca hoje só aceita texto já extraído

A Biblioteca do sunOS (SPEC-002) suporta upload, mas o indexador processa apenas texto normalizado. Documentos binários — PDFs de brand book, decks de campanha em PPTX, planilhas de budget em XLSX, áudios de briefing, vídeos de apresentação — são os formatos que clientes e a equipe da Suno produzem cotidianamente.

### Formatos típicos de clientes de agência

| Formato | Conteúdo típico | Frequência |
|---------|----------------|------------|
| `.pdf` | Brand book, relatório de performance, normativo de comunicação | Alta |
| `.pptx` | Deck de briefing, apresentação de campanha, roadmap de marketing | Alta |
| `.xlsx` | Planilha de budget de mídia, tracker de resultados, calendário editorial | Média |
| `.docx` | Briefing de texto, roteiro aprovado, ata de reunião | Média |
| `.mp3` / `.wav` | Gravação de briefing, call de alinhamento, feedback de cliente | Baixa |
| `.mp4` | Vídeo de apresentação de campanha, showcase de produto | Baixa |

### GCS como autoridade dos binários originais

Os arquivos originais ficam no Google Cloud Storage (`gs://suno-os-{client_slug}/raw/`). O pipeline converte cada formato para texto normalizado e deposita em `gs://suno-os-{client_slug}/extracted/`. O agent e o indexador operam sempre sobre texto — nunca sobre binários.

Essa separação garante:
1. O arquivo original nunca é sobrescrito (re-extração sempre possível)
2. Melhorias no extractor beneficiam re-ingestão de documentos já existentes
3. Agents não precisam de capacidade de leitura de binários

---

## Decisão

Adotar **pipeline de extração pré-indexação**: binários ficam no GCS; o módulo `api/chat/ingestion/extractor.py` converte para texto antes de indexar.

### Arquitetura em camadas

```
GCS (raw/) -- binários originais, imutáveis
  ↓ api/chat/ingestion/extractor.py
  PDF    → PyMuPDF4LLM → .md  (headers e tabelas preservados)
  PPTX   → python-pptx → .txt (um bloco por slide)
  XLSX   → openpyxl    → .json estruturado (por aba)
  DOCX   → python-docx → .md  (headings como Markdown)
  MP3/WAV → Vertex AI STT → .txt (com diarização de falantes)
  MP4    → ffmpeg extrai áudio → STT → .txt
  ↓
GCS (extracted/) -- texto normalizado, input do indexador
  ↓ api/chat/ingestion/processor.py + chunker (ADR-005)
PostgreSQL + pgvector (ADR-003)
  collection: biblioteca_{client_slug}
```

### Mapa de extratores

```python
# api/chat/ingestion/extractor.py

EXTRACTORS: dict[str, callable] = {
    ".pdf":  extract_pdf,       # PyMuPDF4LLM
    ".pptx": extract_pptx,      # python-pptx, um bloco por slide
    ".xlsx": extract_xlsx,      # openpyxl, JSON por aba
    ".docx": extract_docx,      # python-docx, headings como Markdown
    ".wav":  transcribe_audio,  # Vertex AI STT pt-BR com diarização
    ".mp3":  transcribe_audio,
    ".mp4":  transcribe_video,  # ffmpeg extrai áudio, depois STT
    ".txt":  passthrough,
    ".md":   passthrough,
}

def detect_source_type(path: Path) -> str:
    mapping = {
        ".pdf": "pdf", ".docx": "document", ".pptx": "presentation",
        ".xlsx": "spreadsheet", ".wav": "transcription",
        ".mp3": "transcription", ".mp4": "transcription",
    }
    return mapping.get(path.suffix.lower(), "text")
```

### Configuração do Vertex AI STT

```python
async def transcribe_audio(path: Path) -> str:
    from google.cloud import speech_v1
    gcs_uri = await upload_to_gcs_temp(path)
    client = speech_v1.SpeechAsyncClient()
    config = speech_v1.RecognitionConfig(
        encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="pt-BR",
        enable_speaker_diarization=True,
        diarization_speaker_count=4,
    )
    response = await client.long_running_recognize(
        config=config,
        audio=speech_v1.RecognitionAudio(uri=gcs_uri),
    )
    result = await response.result()
    return _format_transcript_with_speakers(result)
```

### Três modos de trigger

**Modo 1: Upload via Biblioteca UI** — arquivo recebido no endpoint → extractor inline → indexação.

**Modo 2: Ingestão do Google Drive (ADR-006)** — agent baixa arquivo → extractor pela extensão → indexação automática.

**Modo 3: Batch GCS** — Cloud Run Job varre `raw/` e extrai todos os arquivos sem correspondente em `extracted/`.

---

## Consequências

### Positivas
- Agents recebem contexto real de todos os formatos do cliente
- Re-extração possível sem alterar o binário original (GCS imutável)
- Extractor modular: novo formato = novo handler, sem alterar o pipeline
- STT com diarização preserva 'quem disse o quê' em briefings gravados

### Negativas
- Dependência de `ffmpeg` no container para extração de áudio de MP4
- Vertex AI STT tem custo por minuto de áudio (~R$0,02/min para pt-BR)
- PDFs escaneados sem camada de texto não são extraídos sem Document AI
- Arquivos Google-native precisam de export via Drive API (ADR-006)

### Neutras
- Módulo `api/chat/ingestion/` já parcialmente implementado (SPEC-002)
- `source_type` em cada chunk determina o splitter aplicado (ADR-005)

---

## Referências

- koro-agent ADR-004: Arquitetura de Memória Persistente — modelo de referência adaptado
- ADR-003: RAG PostgreSQL + pgvector — camada que este pipeline alimenta
- ADR-005: Estratégia de Chunking por Tipo de Documento
- ADR-006: Integração Google Drive
- [PyMuPDF4LLM](https://pymupdf.readthedocs.io/en/latest/pymupdf4llm/)
- [Vertex AI Speech-to-Text](https://cloud.google.com/speech-to-text/docs/async-recognize)
- [python-pptx](https://python-pptx.readthedocs.io/)
- [openpyxl](https://openpyxl.readthedocs.io/)
