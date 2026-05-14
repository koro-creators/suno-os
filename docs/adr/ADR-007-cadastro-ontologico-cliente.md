# ADR-007: Cadastro Ontológico de Cliente

**Status:** Proposto
**Data:** 2026-05-14
**Decisores:** Heitor Miranda (Inovação), José Lucas (Tech Lead)
**Contexto Técnico:** sunOS — Next.js 14 + FastAPI + LangGraph + PostgreSQL

---

## Contexto

### O problema de contexto de domínio no sunOS

Quando o agent do sunOS gera copy para a Vivo, ele não sabe que:
- A Vivo usa tom de voz próximo, moderno e otimista
- '5G' é o produto âncora de 2026
- Claims de velocidade precisam seguir as diretrizes do CONAR para o setor de telecom
- A concorrência principal é Claro e TIM

Sem esse contexto, o agent gera outputs genericamente corretos mas sem identidade de marca.
O problema é idêntico ao descrito no koro-agent ADR-002: sem vocabulário privado declarado,
LLMs geram 'sentenças plausíveis sem compreensão contextual real'.

### O cadastro atual de clientes é insuficiente

O `ClientAdmin` hoje tem: `name, slug, color, description, contact, assignedSkills, metrics`.
São campos operacionais — não capturam identidade de marca nem contexto para os agents.

### Contexto de marketing é mais simples que discovery de negócio

O koro-agent modela ontologias complexas com Executivos, Sistemas, Relações formais (REL-001),
Capacidades e Eventos — necessário para processar implantações de sistemas empresariais.

Para o sunOS (marketing e comunicação), o vocabulário relevante é diferente e mais direto:
- **Identidade de marca**: tom de voz, pilares, personalidade
- **Público-alvo**: personas, segmento, comportamentos
- **Contexto de mercado**: categoria, concorrentes, sazonalidade
- **Restrições e diretrizes**: CONAR, claims proibidos, exigências do cliente
- **Objetivos atuais**: campanhas ativas, KPIs, foco do período

Não precisamos de IDs canônicos formais (EXE-001, SIS-002) — precisamos de campos estruturados
que o agent consegue injetar no system prompt.

---

## Decisão

Adicionar **perfil ontológico estruturado** ao cadastro de clientes, organizado em cinco seções.
O preenchimento pode ser manual (formulário) ou assistido por LLM (agent lê documentos da Biblioteca
e propõe o preenchimento — aprovação humana antes de salvar).

### Schema do Perfil Ontológico

```typescript
// lib/client-types.ts — extensão do ClientAdmin

export interface TomDeVoz {
  personalidade: string[];       // ['próximo', 'moderno', 'otimista']
  estilo_linguagem: string;      // 'Informal sem ser vulgar, usa contrações'
  palavras_evitar: string[];     // ['líder', 'inovador', 'disruptivo']
  exemplos_aprovados: string[];  // trechos de copy aprovados como referência
}

export interface Persona {
  nome: string;                  // 'Diego, 28 anos'
  descricao: string;             // perfil comportamental
  dores: string[];               // motivações e frustrações
  canais_preferidos: string[];   // ['Instagram', 'YouTube']
}

export interface ContextoMercado {
  segmento: string;              // 'Telecomunicações B2C'
  categoria: string;             // 'Operadora de telefonia'
  concorrentes: string[];        // ['Claro', 'TIM', 'Oi']
  diferenciais: string[];        // o que diferencia esse cliente dos concorrentes
  sazonalidade: string;          // 'Black Friday crítica; janeiro fraco'
}

export interface RestricoesComunicacao {
  regulatorio: string;           // 'Setor regulado pela ANATEL + CONAR'
  claims_proibidos: string[];    // ['melhor cobertura', 'mais rápido']
  obrigatorios: string[];        // ['*Sujeito a disponibilidade na área']
  tom_proibido: string;          // 'Nunca usar urgência agressiva'
}

export interface ObjetivosPeriodo {
  foco: string;                  // 'Aquisição de planos pós-pago 5G'
  campanhas_ativas: string[];    // ['Campanha Verão 5G', 'Bundle Vivo Total']
  kpis: string[];                // ['CTR > 2%', 'CPA < R$150']
  periodo_vigencia: string;      // '2026-Q2'
}

export interface PerfilOntologico {
  tom_de_voz: TomDeVoz;
  personas: Persona[];
  mercado: ContextoMercado;
  restricoes: RestricoesComunicacao;
  objetivos: ObjetivosPeriodo;
  pilares_marca: string[];       // ['Inovação', 'Conexão', 'Simplicidade']
  ultima_atualizacao: string;    // ISO 8601
  preenchido_por: 'manual' | 'assistido' | 'pendente';
}

export interface ClientAdmin {
  // campos existentes preservados
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  contact: string;
  assignedSkills: string[];
  metrics: ClientMetrics;
  createdAt: string;
  updatedAt: string;
  // NOVO
  ontologia?: PerfilOntologico;
}
```

### Injeção no system prompt do agent

```python
# api/chat/agents/base.py

def build_client_context(client_slug: str, ontologia: dict | None) -> str:
    if not ontologia:
        return ""
    sections = []
    tv = ontologia.get('tom_de_voz', {})
    if tv:
        sections.append(
            'TOM DE VOZ:\n'
            f"  Personalidade: {', '.join(tv.get('personalidade', []))}\n"
            f"  Estilo: {tv.get('estilo_linguagem', '')}\n"
            f"  Evitar: {', '.join(tv.get('palavras_evitar', []))}"
        )
    mercado = ontologia.get('mercado', {})
    if mercado:
        sections.append(
            f"MERCADO: {mercado.get('categoria', '')} | "
            f"Concorrentes: {', '.join(mercado.get('concorrentes', []))}"
        )
    restricoes = ontologia.get('restricoes', {})
    if restricoes and restricoes.get('claims_proibidos'):
        sections.append(
            f"CLAIMS PROIBIDOS: {', '.join(restricoes['claims_proibidos'])}"
        )
    objetivos = ontologia.get('objetivos', {})
    if objetivos:
        sections.append(
            f"FOCO ATUAL: {objetivos.get('foco', '')}"
        )
    return '\n\n'.join(sections)
```

### Preenchimento assistido por LLM

Quando o operador aciona 'Preencher com IA', o agent:
1. Busca documentos da Biblioteca do cliente (`search_biblioteca(query='tom de voz marca', client_slug=slug)`)
2. Lê brand book e briefings disponíveis
3. Propõe preenchimento de cada seção
4. Exibe para aprovação/edição antes de salvar

```python
# api/chat/agents/ontology_assistant.py

ONTOLOGY_ASSISTANT_PROMPT = '''
Você é um assistente de cadastro de marca. Analise os documentos disponíveis
do cliente {client_slug} e proponha o preenchimento do perfil ontológico.

Para cada seção (Tom de Voz, Personas, Mercado, Restrições, Objetivos):
- Extraia informações explícitas dos documentos
- Cite o documento de origem para cada informação
- Indique 'não encontrado' quando não houver evidência

NÃO invente informações. Só proponha o que está evidenciado nos documentos.
'''
```

### Nova aba no ClientEditor

O `ClientEditorTabs` ganha uma aba 'Ontologia' com formulário estruturado por seção.
Cada seção tem:
- Campos de texto para preenchimento manual
- Botão 'Preencher com IA' (disponível quando há documentos na Biblioteca)
- Status: `pendente | manual | assistido`
- Data de última atualização

---

## Consequências

### Positivas
- Agents recebem contexto de marca estruturado — outputs com identidade real do cliente
- Schema simples e preenchível sem expertise técnica (sem IDs canônicos formais)
- Preenchimento assistido reduz atrito do onboarding de novos clientes
- Perfil é reutilizável por todos os agents e workflows do cliente

### Negativas
- Campo `ontologia` é opcional — clientes sem preenchimento continuam sem contexto de marca
- Preenchimento assistido requer documentos na Biblioteca (depende de ADR-003/004)
- Manutenção: quando a marca evolui, o perfil precisa ser atualizado manualmente

### Neutras
- `ClientAdmin` type estendido (campo `ontologia?: PerfilOntologico` é opcional — sem breaking change)
- Backend: nova coluna JSONB `ontologia` na tabela de clientes do Cloud SQL
- `ClientEditorTabs` ganha aba 'Ontologia' (nova tab, sem alterar as existentes)

---

## Diferença em relação ao koro-agent ADR-002

| Aspecto | koro-agent | sunOS |
|---------|-----------|-------|
| Propósito | Discovery de negócio para implantação de sistemas | Marketing e comunicação de marca |
| Entidades | Executivos, Sistemas, Fornecedores com IDs canônicos | Campos de marca estruturados |
| Relações | Formais com predicados tipados (responsavel_por, depende_de) | Implícitas nos campos textuais |
| Complexidade | Alta (3 camadas, CQs, HITL gates) | Baixa (formulário rico + LLM assistido) |
| HITL | Gate obrigatório por entidade proposta | Aprovação por seção (UI simples) |
| Casos de uso | Curadoria de documentos técnicos, geração de BRD/PRD | Geração de copy, briefings, planos de mídia |

---

## Referências

- koro-agent ADR-002: Core Ontology em Três Camadas — modelo de referência adaptado para contexto de marketing
- ADR-002 sunOS: Engine Único com Context Injection — ontologia é o mecanismo de personalização por cliente
- ADR-003: RAG PostgreSQL + pgvector — `search_biblioteca` alimenta o preenchimento assistido
- ADR-004: Pipeline de Extração — documentos da Biblioteca precisam estar indexados para o assistente funcionar
- [Knowledge Graph Guys: Philosophy Eats AI](https://knowledge-graph-guys.com) — ontologia como vocabulário de criação de valor