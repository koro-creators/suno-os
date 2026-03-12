import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  PenTool,
  UserRound,
  Clapperboard,
  FileSearch,
  Menu,
  X,
} from "lucide-react";
import "./App.css";

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = "https://videorag-api-mx3edyv2za-uc.a.run.app";

const AGENTS = [
  {
    id: "videorag",
    label: "VideoRAG",
    icon: Play,
    system:
      "Você é um assistente especializado em análise de vídeos publicitários indexados. Responda com base nos vídeos disponíveis, citando timestamps e elementos visuais relevantes.",
    placeholder: "Pergunte sobre os vídeos indexados...",
    hint: "Análise de campanhas em vídeo",
  },
  {
    id: "copy",
    label: "Copy",
    icon: PenTool,
    system:
      "Você é um redator publicitário sênior especializado em campanhas brasileiras. Gere copies impactantes, diretos e adequados ao canal solicitado. Entregue sempre variações.",
    placeholder: "Descreva o produto, tom e canal...",
    hint: "Geração de textos publicitários",
  },
  {
    id: "persona",
    label: "Persona",
    icon: UserRound,
    system:
      "Você é um simulador de personas sintéticas para pesquisa de marketing. Incorpore completamente a persona descrita e responda como ela — com suas dores, linguagem, objeções e desejos reais. Nunca quebre o personagem.",
    placeholder: "Descreva a persona ou solicite uma simulação...",
    hint: "Simulação de consumidor sintético",
  },
  {
    id: "roteiro",
    label: "Roteiro",
    icon: Clapperboard,
    system:
      "Você é um diretor criativo e roteirista especializado em filmes publicitários brasileiros. Crie roteiros estruturados com cenas numeradas, diálogos, direção de arte, trilha sonora sugerida e indicações técnicas de câmera.",
    placeholder: "Descreva o conceito, produto e duração...",
    hint: "Roteiros e filmes publicitários",
  },
  {
    id: "brief",
    label: "Brief",
    icon: FileSearch,
    system:
      "Você é um estrategista de marketing especializado em análise e destrinchamento de briefs. Identifique gaps, oportunidades não exploradas, públicos-alvo, tom de voz ideal, KPIs relevantes e proponha perguntas que o cliente ainda não fez.",
    placeholder: "Cole ou descreva o brief aqui...",
    hint: "Análise e estruturação de briefs",
  },
];

const CLIENTS = [
  "santander",
  "vivo",
  "americanas",
  "mrv",
  "sicredi",
  "bmg",
  "stone",
];

const FALLBACKS = {
  videorag:
    "Com base nos vídeos indexados, a campanha estrutura sua narrativa em três arcos emocionais com paleta cromática consistente.",
  copy: 'Aqui estão três variações para mídia social:\n\n**Emocional:** "Você não está comprando um apartamento. Está construindo o lugar onde sua família vai crescer."\n\n**Racional:** "Crédito Imobiliário: taxa a partir de 8,99% a.a. + TR. Simule em 2 minutos."\n\n**Urgência:** "Condições especiais só até 31/03. Simule agora."',
  persona:
    "Oi. Sou a Fernanda, 41 anos, professora em Campinas. Quero sair do aluguel, mas toda vez que pesquiso sobre financiamento, fico perdida.",
  roteiro:
    '**ROTEIRO — "O DIA QUE SEMPRE FOI SEU"**\n*Filme 30" · Crédito Imobiliário*\n\n**CENA 1** — Close de chave de aluguel sendo devolvida.\n**CENA 2** — A mesma mão abre uma porta diferente. Chave nova.\n**CENA 3** — Família entra, olha ao redor. Silêncio. Sorriso.',
  brief:
    "**DIAGNÓSTICO DO BRIEF**\n\nGaps identificados:\n— Nenhuma diferenciação competitiva declarada\n— Tom genérico, sem voz de marca definida\n— Público-alvo amplo demais\n\nOportunidade: o medo de endividamento é o maior freio de conversão — o brief não o endereça.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseMarkdown(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

function LoadingDots() {
  return (
    <div className="loading-dots" role="status" aria-label="Carregando resposta">
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function KoroStudio() {
  const [agent, setAgent] = useState(AGENTS[0]);
  const [clientId, setClientId] = useState("santander");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [threadId, setThreadId] = useState(
    () => `santander:user-${Date.now()}`
  );

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // ── Effects ───────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiOnline(d.status === "healthy"))
      .catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: 0,
        role: "system-greeting",
        agent: agent.id,
        content: agent.hint,
      },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    inputRef.current?.focus();
  }, [agent, clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetChat = useCallback(() => {
    setMessages([
      {
        id: 0,
        role: "system-greeting",
        agent: agent.id,
        content: agent.hint,
      },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
  }, [agent, clientId]);

  // ── Send ──────────────────────────────────────────────────────────

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    const userMsg = { id: Date.now(), role: "user", content: text };
    const asstId = Date.now() + 1;
    const asstMsg = {
      id: asstId,
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((p) => [...p, userMsg, asstMsg]);

    const simulateStream = async (full) => {
      const words = full.split(" ");
      let built = "";
      for (let i = 0; i < words.length; i++) {
        built += (i > 0 ? " " : "") + words[i];
        if (i % 2 === 0) {
          const snap = built;
          setMessages((p) =>
            p.map((m) => (m.id === asstId ? { ...m, content: snap } : m))
          );
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      setMessages((p) =>
        p.map((m) =>
          m.id === asstId ? { ...m, content: full, streaming: false } : m
        )
      );
    };

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          client_id: clientId,
          agent_id: agent.id,
          message: text,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") break;
          try {
            const p = JSON.parse(d);
            if (p.text) {
              full += p.text;
              const snap = full;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === asstId ? { ...m, content: snap } : m
                )
              );
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
      setMessages((p) =>
        p.map((m) =>
          m.id === asstId ? { ...m, streaming: false } : m
        )
      );
    } catch {
      await simulateStream(FALLBACKS[agent.id] || "Erro ao conectar.");
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const AgentIcon = agent.icon;
  const statusLabel =
    apiOnline === true ? "online" : apiOnline === false ? "offline" : "loading";
  const statusText =
    apiOnline === true
      ? "API Online"
      : apiOnline === false
        ? "API Offline"
        : "Verificando...";

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className="btn-menu"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <h1>Koro Studio</h1>
      </header>

      {/* Overlay */}
      <div
        className="overlay"
        data-open={sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className="sidebar"
        data-open={sidebarOpen}
        role="complementary"
        aria-label="Painel de navegação"
      >
        <div className="sidebar-brand">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1>Koro Studio</h1>
            <button
              className="btn-menu"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
              style={{ display: sidebarOpen ? "flex" : "none" }}
            >
              <X size={16} />
            </button>
          </div>
          <div className="sidebar-status">
            <div className="sidebar-status-dot" data-status={statusLabel} />
            <span className="sidebar-status-label">{statusText}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-section-label" htmlFor="client-select">
            Cliente
          </label>
          <select
            id="client-select"
            className="client-select"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSidebarOpen(false);
            }}
          >
            {CLIENTS.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <nav className="sidebar-agents" aria-label="Agentes">
          <div className="sidebar-section-label">Agentes</div>
          {AGENTS.map((ag) => {
            const Icon = ag.icon;
            const active = agent.id === ag.id;
            return (
              <button
                key={ag.id}
                className="agent-btn"
                data-active={active}
                onClick={() => {
                  setAgent(ag);
                  setSidebarOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                aria-label={`Agente ${ag.label}`}
              >
                <span className="agent-btn-icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                <span className="agent-btn-label">{ag.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            VideoRAG &middot; Gemini 2.5 Pro
            <br />
            Prototype &middot; v0.2
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="chat-header">
          <div>
            <div className="chat-header-info">
              <span className="chat-header-title">{agent.label}</span>
              <span className="chat-header-client">
                {clientId.toUpperCase()}
              </span>
            </div>
            <div className="chat-header-hint">{agent.hint}</div>
          </div>
          <button
            className="btn-clear"
            onClick={resetChat}
            aria-label="Limpar conversa"
          >
            limpar
          </button>
        </header>

        <div
          className="messages"
          role="log"
          aria-live="polite"
          aria-label="Mensagens da conversa"
        >
          <div className="messages-inner">
            {messages.map((msg) => {
              if (msg.role === "system-greeting") {
                return (
                  <div key={msg.id} className="msg-greeting">
                    <div className="msg-greeting-label">
                      <AgentIcon size={12} aria-hidden="true" />
                      {agent.label.toUpperCase()}
                    </div>
                    <div className="msg-greeting-text">{msg.content}</div>
                  </div>
                );
              }

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="msg-user">
                    <div className="msg-label">Você</div>
                    <div className="msg-user-text">{msg.content}</div>
                    <hr className="msg-divider" />
                  </div>
                );
              }

              if (msg.role === "assistant") {
                return (
                  <article key={msg.id} className="msg-assistant">
                    <div className="msg-label">
                      <AgentIcon size={12} aria-hidden="true" />
                      {agent.label.toUpperCase()}
                    </div>
                    {msg.content ? (
                      <div className="msg-assistant-content">
                        <p
                          dangerouslySetInnerHTML={{
                            __html:
                              parseMarkdown(msg.content) +
                              (msg.streaming
                                ? '<span class="msg-cursor" aria-hidden="true"></span>'
                                : ""),
                          }}
                        />
                      </div>
                    ) : (
                      <LoadingDots />
                    )}
                  </article>
                );
              }
              return null;
            })}
            <div ref={endRef} />
          </div>
        </div>

        <footer className="chat-input">
          <div className="chat-input-inner">
            <div className="chat-input-row" data-active={loading}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agent.placeholder}
                rows={1}
                className="chat-textarea"
                aria-label="Sua mensagem"
              />
              <button
                className="btn-send"
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Enviar mensagem"
              >
                Enviar
              </button>
            </div>
            <div className="chat-input-hint">
              <kbd>Enter</kbd> enviar &middot; <kbd>Shift+Enter</kbd> nova linha
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
