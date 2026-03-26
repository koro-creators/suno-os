# sunOS — Project Conventions

## Overview

Protótipo navegável do sunOS, plataforma interna de IA da Suno United Creators. Organiza skills de IA por cliente usando metáfora de sistema solar.

## Monorepo Structure

Frontend e backend no mesmo repo, deploy como serviços separados no Cloud Run.

| Serviço | Path | Stack | Porta |
|---------|------|-------|-------|
| Frontend | raiz (`app/`, `components/`, etc.) | Next.js 14 + TypeScript | 3003 |
| Backend | `api/` | FastAPI + LangGraph + Python 3.11 | 8080 |

## Stack (Frontend)

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS + CSS variables (design system)
- Lucide React (icons)
- React Context (state management)
- Porta: **3003** (3000 está ocupada)

## Stack (Backend — `api/`)

- Python 3.11+ / FastAPI / uv
- LangGraph StateGraph (agent orchestration)
- LangChain (Gemini Flash default, GPT-4o, Claude como alternativas)
- PostgreSQL (Cloud SQL shared) / MLflow (tracing)
- Cloud Run (deploy) / Porta: **8080**
- Veja `api/CLAUDE.md` para conventions do backend

## Design System

### CSS Variables (defined in `app/globals.css`)

| Token | Usage |
|-------|-------|
| `--void` | Background principal |
| `--deep` | Surface level 1 (cards, panels) |
| `--nebula` | Surface level 2 (hover, inputs) |
| `--twilight` | Borders fortes |
| `--sun` | Accent (#FFC801) |
| `--border-subtle` | Borders sutis |
| `--text-primary` | Texto principal |
| `--text-secondary` | Texto secundário |
| `--text-muted` | Texto muted |
| `--criacao` | Tipo skill criação |
| `--midia` | Tipo skill mídia |
| `--planejamento` | Tipo skill planejamento |

### Component Patterns

- Use `'use client'` em componentes interativos
- Use **inline styles** para layout de componentes (não Tailwind classes)
- Border radius: 12px (cards), 8px (inputs), 9999px (pills)
- Transições: 150ms ease (hover), 200ms ease (layout)
- Icons: lucide-react, size 14, strokeWidth 1.5
- Focus ring: `boxShadow: '0 0 0 2px rgba(255,200,1,0.15)'`
- Ambos os temas (dark + light) devem funcionar via CSS variables

## Project Structure

```
app/                    # Next.js pages (App Router)
  [clientSlug]/         # Sistema solar (4 níveis)
  skills/               # Skills admin
  biblioteca/           # Biblioteca admin
  clientes/             # Clientes admin
components/
  admin/                # Componentes do Skills admin
  biblioteca/           # Componentes da Biblioteca
  chat/                 # Chat interface + feedback
  clientes/             # Componentes do Clientes admin
  layout/               # Layout (Sidebar, AppHeader, Providers)
  solar/                # Sistema solar (PlanetNode, OrbitRing, etc)
  ui/                   # UI primitivas (Toast)
contexts/               # React Context providers
data/                   # Mock data
lib/                    # Types + utils
hooks/                  # Custom hooks
api/                    # Backend (FastAPI + LangGraph) — deploy separado
  main.py               # FastAPI entry point
  config.py             # Pydantic Settings
  chat/                 # Chat module (agents, graph, tools, skills, schemas)
  models/               # SQLAlchemy models
  core/                 # Firebase, shared utils
  Dockerfile            # Container para Cloud Run
  cloudbuild.yaml       # CI/CD
```

## Restrictions

- **NÃO modifique `data/clients.ts`** — é o source do sistema solar e deve permanecer intacto
- **NÃO instale novas dependências** sem necessidade (Tailwind + Lucide já estão)
- **NÃO mude o visual** das páginas existentes do sistema solar (Home, Client, Skill, Moon)
- **NÃO use `.env` files no frontend** — tudo é mocado (exceto `NEXT_PUBLIC_API_URL` para backend)
- **Backend** usa `.env` em `api/` (ver `api/.env.example`)
- Sempre verifique com `npx tsc --noEmit` após mudanças

## Admin CRUD Pattern

Para cada nova feature admin, o padrão é:
1. Types em `lib/{feature}-types.ts`
2. Mock data em `data/{feature}-admin.ts`
3. Context em `contexts/{Feature}Context.tsx`
4. Componentes em `components/{feature}/`
5. Pages em `app/{feature}/` (catálogo + editor + new)
6. Registrar provider em `components/layout/Providers.tsx`
7. Adicionar href no Sidebar

## Existing Features

- **Skills Admin** (`/skills`) — CRUD de skills de IA com 4 tabs
- **Biblioteca** (`/biblioteca`) — Base de conhecimento com tags + scopes
- **Clientes Admin** (`/clientes`) — CRUD de clientes com métricas
- **HITL Feedback** — Thumbs up/down no chat + validação no sidebar
- **Sistema Solar** — 4 níveis de navegação (Home → Cliente → Skill → Chat)
