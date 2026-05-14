# ADR-005: Estratégia de Chunking por Tipo de Documento

**Status:** Proposto
**Data:** 2026-05-14
**Decisores:** Heitor Miranda (Inovação), José Lucas (Tech Lead)
**Contexto Técnico:** sunOS — FastAPI + LangChain text-splitters + PostgreSQL pgvector

---

## Contexto

O pipeline de indexação da Biblioteca (ADR-003 + ADR-004) recebe texto normalizado de seis tipos de documento.
Aplicar o mesmo `RecursiveCharacterTextSplitter(chunk_size=400)` para todos os tipos é inadequado por três razões:

1. **PDFs e DOCXs têm estrutura Markdown com headers hierárquicos** — chunks que cortam no meio de seções perdem o contexto do header.
2. **400 chars é insuficiente para texto de marketing em português** — um parágrafo de tom de voz tem 150-250 palavras (~900-1500 chars).
3. **Cada tipo tem unidade semântica natural distinta** — slides, turnos de fala, abas de planilha não são equivalentes a 'caractere N'.

---

## Decisão

Adotar **chunking por tipo de documento** com base no campo `source_type` gerado pelo extractor (ADR-004).

### Splitters por source_type

#### 1. PDF e DOCX (`source_type: pdf | document`)

PyMuPDF4LLM e python-docx geram Markdown com headers hierárquicos.
Pipeline: `MarkdownHeaderTextSplitter` → `RecursiveCharacterTextSplitter`.

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter

md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[("#", "secao"), ("##", "subsecao"), ("###", "topico")],
    strip_headers=False,
)
char_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)

def chunk_markdown(text: str) -> list[Document]:
    md_chunks = md_splitter.split_text(text)
    return char_splitter.split_documents(md_chunks)
    # Cada chunk herda metadata: {secao, subsecao, topico, page}
```

**Tamanhos:** child=600 chars, parent=1200 chars
**Metadata resultante:** `{"secao": "Pilares de Marca", "subsecao": "Tom de Voz", "page": 4}`

#### 2. Transcrições de Reunião (`source_type: transcription`)

STT com diarização produz texto com turnos de fala como unidade semântica natural.
Chunk que corta no meio de um turno perde a atribuição (quem disse o quê).

```python
def chunk_transcription(text: str) -> list[Document]:
    turns = text.split("\n")
    chunks = []
    current_chunk = []
    current_len = 0
    for turn in turns:
        if current_len + len(turn) > 800 and current_chunk:
            chunks.append(Document(page_content="\n".join(current_chunk)))
            current_chunk = [turn]
            current_len = len(turn)
        else:
            current_chunk.append(turn)
            current_len += len(turn)
    if current_chunk:
        chunks.append(Document(page_content="\n".join(current_chunk)))
    return chunks
```

**Tamanhos:** child=400 chars (turno único), parent=800 chars (grupo de turnos)

#### 3. Apresentações PPTX (`source_type: presentation`)

O extractor (ADR-004) separa slides com `--- Slide N ---`. Cada slide é a unidade semântica natural.
Slides muito longos (com notas de apresentação) são subdivididos por `char_splitter`.

```python
def chunk_presentation(text: str) -> list[Document]:
    slide_blocks = text.split("--- Slide ")
    chunks = []
    char_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    for block in slide_blocks:
        if not block.strip():
            continue
        lines = block.split("\n", 1)
        slide_num = lines[0].strip().rstrip("-").strip()
        slide_text = lines[1] if len(lines) > 1 else ""
        if len(slide_text) <= 1000:
            chunks.append(Document(
                page_content=slide_text,
                metadata={"slide": slide_num}
            ))
        else:
            sub_chunks = char_splitter.create_documents([slide_text])
            for c in sub_chunks:
                c.metadata["slide"] = slide_num
            chunks.extend(sub_chunks)
    return chunks
```

**Tamanhos:** 1 slide por chunk (unidade natural); subdivide se >1000 chars

#### 4. Planilhas XLSX (`source_type: spreadsheet`)

O extractor (ADR-004) gera JSON por aba. Cada aba (ex: 'Budget Q2', 'Calendário Maio') é a unidade semântica.
Linhas são agrupadas em chunks de no máximo 20 registros para evitar chunks gigantes.

```python
from langchain_text_splitters import RecursiveJsonSplitter
import json

def chunk_spreadsheet(text: str) -> list[Document]:
    data = json.loads(text)
    chunks = []
    splitter = RecursiveJsonSplitter(max_chunk_size=1500)
    for sheet_name, rows in data.items():
        if not rows:
            continue
        # Grupos de 20 linhas por chunk
        for i in range(0, len(rows), 20):
            batch = rows[i:i+20]
            chunk_text = json.dumps({sheet_name: batch}, ensure_ascii=False, indent=2)
            chunks.append(Document(
                page_content=chunk_text,
                metadata={"sheet": sheet_name, "rows": f"{i+1}-{i+len(batch)}"}
            ))
    return chunks
```

**Unidade:** 20 linhas por chunk por aba
**Metadata:** `{"sheet": "Budget Q2", "rows": "1-20"}`

### Dispatcher central

```python
# api/chat/ingestion/processor.py

CHUNKERS = {
    "pdf":          chunk_markdown,
    "document":     chunk_markdown,
    "transcription": chunk_transcription,
    "presentation": chunk_presentation,
    "spreadsheet":  chunk_spreadsheet,
    "text":         chunk_default,
}

def chunk_document(text: str, source_type: str) -> list[Document]:
    chunker = CHUNKERS.get(source_type, chunk_default)
    return chunker(text)
```

### Tamanhos por tipo (resumo)

| source_type | child (vector search) | parent (retornado ao agent) |
|------------|----------------------|----------------------------|
| pdf | 600 chars | 1200 chars |
| document | 600 chars | 1200 chars |
| transcription | 400 chars (turno) | 800 chars (grupo) |
| presentation | 1 slide | slide completo |
| spreadsheet | 20 linhas / aba | aba completa |

---

## Consequências

### Positivas
- Metadata de seção/slide/aba preservado nos chunks para referência ao usuário
- Tamanhos calibrados para texto de marketing em português
- Chunker modular: novo tipo = novo handler no dispatcher

### Negativas
- Quatro chunkers para manter em vez de um
- Novo `source_type` exige implementação de novo chunker

### Neutras
- `source_type` vem do extractor (ADR-004) e determina o chunker automaticamente
- RecordManager (ADR-003) usa hash do conteúdo para deduplicação — chunking determinístico é requisito

---

## Referências

- koro-agent ADR-007: Estratégia de Chunking por Tipo de Documento — modelo de referência adaptado
- ADR-003: RAG PostgreSQL + pgvector — ParentDocumentRetriever usa child/parent splitters deste ADR
- ADR-004: Pipeline de Extração — `source_type` gerado pelo extractor
- [LangChain MarkdownHeaderTextSplitter](https://python.langchain.com/docs/how_to/markdown_header_metadata_splitter/)
- [LangChain RecursiveJsonSplitter](https://python.langchain.com/docs/how_to/recursive_json_splitter/)
- [LangChain ParentDocumentRetriever](https://python.langchain.com/docs/how_to/parent_document_retriever/)