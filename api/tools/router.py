"""Tool registry endpoint (SPEC-005 TASK-C08b).

`GET /api/tools?for_user=current` powers the canvas NodePalette: returns the
list of tools available to the requesting user, filtered by RBAC.

Until FA-09 RBAC is wired into requests, the filter is permissive — every
authenticated user sees every tool. The `Tool.role_restriction` field is
already present so future work can flip the filter without changing the
contract surface (frontend code is forward-compatible).

Categories follow constitution §2 of SPEC-003:
  • criação    — gerative tools (text/image/video).
  • mídia      — measurement / planning / market analysis.
  • planejamento — workflow control / scheduling.

The shape mirrors what `WorkflowStepEditor.tsx` used to hardcode in the
frontend (constant `AVAILABLE_TOOLS`); moving it server-side closes the
hole flagged in TASK-C08 (canvas was loading a list the user might not be
authorised to invoke).
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/tools", tags=["Tools"])

ToolCategory = Literal["criacao", "midia", "planejamento", "controle"]


class ToolDescriptor(BaseModel):
    tool_name: str
    label: str
    category: ToolCategory
    description: str
    default_config: dict = Field(default_factory=dict)
    default_introduction: str = ""  # texto pré-preenchido no campo INTRODUÇÃO DO CANVAS
    locked_introduction: bool = False  # True = introdução fixa, não editável no drawer
    role_restriction: list[str] | None = None  # None = available to all roles


# Source of truth for the canvas NodePalette. Order is shown in the UI.
TOOL_CATALOG: list[ToolDescriptor] = [
    ToolDescriptor(
        tool_name="search_knowledge",
        label="Buscar conhecimento",
        category="criacao",
        description="Pesquisa na Biblioteca + web (caixa-preta para Operacional).",
        default_config={"query": "", "top_k": 5},
    ),
    ToolDescriptor(
        tool_name="generate_text",
        label="Compor texto",
        category="criacao",
        description="Geração de texto via LLM com contexto do step anterior.",
        default_config={"max_tokens": 1024},
    ),
    ToolDescriptor(
        tool_name="consultar_ontologia",
        label="Ontologia do cliente",
        category="criacao",
        description="Carrega a ontologia do cliente (marca, persona, tom de voz).",
        default_config={},
    ),
    ToolDescriptor(
        tool_name="consultar_cliente",
        label="Perfil do cliente",
        category="criacao",
        description="Retorna nome, slug, descrição, cor, sponsor e status do cliente selecionado.",
        default_config={},
    ),
    ToolDescriptor(
        tool_name="query_data",
        label="Consultar métricas",
        category="midia",
        description="Query estruturada (BigQuery / Cloud SQL) para relatórios.",
        default_config={"query": ""},
    ),
    ToolDescriptor(
        tool_name="send_slack",
        label="Enviar para Slack",
        category="planejamento",
        description="Posta mensagem em canal Slack autorizado.",
        default_config={"channel": "#reports"},
    ),
    ToolDescriptor(
        tool_name="send_email",
        label="Enviar email",
        category="planejamento",
        description="Email via SendGrid/SES.",
        default_config={"to": "team@example.com"},
    ),
    ToolDescriptor(
        tool_name="log_result",
        label="Registrar resultado",
        category="planejamento",
        description="Persistência simples para auditoria.",
        default_config={},
    ),
    ToolDescriptor(
        tool_name="ler_atas_reunioes",
        label="Ler atas de reuniões",
        category="criacao",
        description=(
            "Carrega a ata identificada pelo gatilho de nova reunião e entrega ao agente "
            "com instrução para extração estruturada de decisões, próximos passos e participantes."
        ),
        default_config={},
        default_introduction=(
            "Lê o conteúdo da ata de reunião identificada pelo gatilho. "
            "Use esta ferramenta para obter o texto da ata antes de qualquer análise."
        ),
        locked_introduction=True,
    ),
    ToolDescriptor(
        tool_name="gerar_pdf",
        label="Gerar PDF",
        category="planejamento",
        description=(
            "Salva o conhecimento gerado como documento na pasta 'base' "
            "e registra na Biblioteca com status 'gerado'. "
            "O agente determina o cliente a partir do contexto da conversa."
        ),
        default_config={},
        default_introduction=(
            "Salva o documento de conhecimento na pasta 'base'. "
            "CHAME ESTA FERRAMENTA imediatamente após analisar a ata — "
            "NÃO pergunte ao usuário nenhuma informação. "
            "Derive todos os argumentos do conteúdo da ata: "
            "crie o titulo, escreva o conteudo estruturado, "
            "identifique cliente_slug e cliente_nome da empresa mencionada "
            "(use 'suno'/'Suno' como fallback se não identificar)."
        ),
        locked_introduction=True,
    ),
]


def _resolve_user_role(for_user: str) -> str:
    """Stub that maps the `for_user` query string to a role.

    `for_user=current` is the contract used by the canvas (see API §6.1
    de SPEC-005). Real implementation pulls JWT principal + RBAC service.
    Until FA-09 RBAC is live, every "current" maps to the most permissive
    role so the frontend can render the full catalog.
    """
    if for_user == "current":
        return "lider"
    return "operacional"


def _is_visible(tool: ToolDescriptor, role: str) -> bool:
    if tool.role_restriction is None:
        return True
    return role in tool.role_restriction


@router.get("")
async def list_tools(
    for_user: str = Query(default="current", description="`current` resolves the JWT principal."),
) -> list[ToolDescriptor]:
    """Return the tool catalog filtered by the requesting user's role."""
    role = _resolve_user_role(for_user)
    return [t for t in TOOL_CATALOG if _is_visible(t, role)]
