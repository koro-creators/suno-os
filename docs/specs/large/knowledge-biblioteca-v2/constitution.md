---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: constitution
status: rascunho
atualizada: 2026-05-15
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + pgvector"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Evoluir Biblioteca para suportar multimodal + vector search, mantendo interface simples
upstream:
  - docs/brd/parte3-requisitos.md (BR-004, BR-005, BR-006, BR-007, BR-008, BR-015)
  - docs/brd/parte4-regras.md (RN-006, RN-007, RN-010, RN-011, RN-021)
---

# Constitution — Knowledge Architecture + Biblioteca v2

Princípios imutáveis para a evolução do sistema de conhecimento do sunOS.

## Princípios de Arquitetura

1. **3 camadas de conhecimento** — Context (no prompt, zero latência), Retrieval (busca sob demanda via tools), Processing (ingestão em background). Cada dado vive na camada certa.
2. **Tipo de dado define a estratégia, não o inverso** — PDF → chunk + embed. Áudio → transcreve + embed. Vídeo → transcreve + keyframes. Imagem → caption + tags. Não existe "um RAG pra tudo".
3. **Uma fase de cada vez** — Não construir pipeline de vídeo antes de validar pipeline de texto. Cada fase entrega valor isolado.
4. **BigQuery é futuro** — Text-to-SQL para dados estruturados fica fora do escopo desta spec.
5. **Backward compatible** — Biblioteca v1 (documentos texto) continua funcionando. v2 adiciona, não substitui.

## Princípios de Qualidade

1. **Embedding é tão bom quanto o chunk** — Chunks mal cortados geram embeddings inúteis. Chunking por seção/parágrafo, não por N caracteres cegos.
2. **Fallback sempre** — Se pgvector não disponível, busca por full-text no PostgreSQL. Se processamento falhar, armazena documento original sem embeddings.
3. **Thumbnails são obrigatórios** — Todo documento na Biblioteca mostra preview visual: ícone por tipo + thumbnail quando disponível.

## Princípios de Segurança

1. **Arquivos no GCS** — Nenhum arquivo binário no PostgreSQL. Apenas metadata + embedding.
2. **Upload size limit** — Max 50MB por arquivo (PDFs grandes, vídeos curtos). Vídeos longos: link externo.
3. **Tipos permitidos** — PDF, DOCX, TXT, MD, PNG, JPG, WEBP, MP3, WAV, MP4, MOV. Nada executável.

## Padrões Obrigatórios

### Frontend
- Inline styles + CSS variables (design system sunOS)
- Lucide icons por tipo de arquivo
- Thumbnails: 120x120 max, gerados no backend

### Backend
- pgvector extension no PostgreSQL existente
- Gemini Embedding API (text-embedding-004) para embeddings
- Gemini 2.5 Flash para processamento multimodal (transcrição, caption)
- Cloud Functions ou Cloud Run Jobs para ingestão assíncrona
- GCS para armazenamento de arquivos originais + thumbnails

## Dependências Aprovadas

### Backend (novas)
- `pgvector` — extensão PostgreSQL para vector similarity search
- `google-cloud-storage` — GCS client (já no pyproject.toml)
- `python-multipart` — upload de arquivos no FastAPI
- `Pillow` — geração de thumbnails

### Frontend
- Nenhuma dependência nova
