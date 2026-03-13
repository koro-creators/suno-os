import { useState, useEffect } from "react";
import { Upload, Menu, X, MessageSquare, Activity } from "lucide-react";
import { API_BASE, CLIENTS } from "./config";
import ChatView from "./views/ChatView";
import IngestView from "./views/IngestView";
import DebugView from "./views/DebugView";
import "./App.css";

export default function KoroStudio() {
  const [clientId, setClientId] = useState("santander");
  const [apiOnline, setApiOnline] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("chat");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiOnline(d.status === "healthy"))
      .catch(() => setApiOnline(false));
  }, []);

  const statusLabel = apiOnline === true ? "online" : apiOnline === false ? "offline" : "loading";
  const statusText = apiOnline === true ? "API Online" : apiOnline === false ? "API Offline" : "Verificando...";

  return (
    <div className="app">
      <header className="mobile-header">
        <button className="btn-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <h1>Koro Studio</h1>
      </header>

      <div className="overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <aside className="sidebar" data-open={sidebarOpen} role="complementary" aria-label="Painel de navegação">
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1>Koro Studio</h1>
            <button className="btn-menu" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" style={{ display: sidebarOpen ? "flex" : "none" }}>
              <X size={16} />
            </button>
          </div>
          <div className="sidebar-status">
            <div className="sidebar-status-dot" data-status={statusLabel} />
            <span className="sidebar-status-label">{statusText}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-section-label" htmlFor="client-select">Cliente</label>
          <select
            id="client-select"
            className="client-select"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setSidebarOpen(false); }}
          >
            {CLIENTS.map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação">
          <div className="sidebar-section-label">Navegação</div>
          <button
            className="agent-btn"
            data-active={view === "chat"}
            onClick={() => { setView("chat"); setSidebarOpen(false); }}
            aria-current={view === "chat" ? "page" : undefined}
          >
            <span className="agent-btn-icon" aria-hidden="true"><MessageSquare size={16} /></span>
            <span className="agent-btn-label">Chat</span>
          </button>
        </nav>

        <div className="sidebar-ingest">
          <div className="sidebar-section-label">Ferramentas</div>
          <button
            className="agent-btn"
            data-active={view === "ingest"}
            onClick={() => { setView("ingest"); setSidebarOpen(false); }}
            aria-current={view === "ingest" ? "page" : undefined}
            aria-label="Ingestão de vídeos"
          >
            <span className="agent-btn-icon" aria-hidden="true"><Upload size={16} /></span>
            <span className="agent-btn-label">Ingestão</span>
          </button>
          <button
            className="agent-btn"
            data-active={view === "debug"}
            onClick={() => { setView("debug"); setSidebarOpen(false); }}
            aria-current={view === "debug" ? "page" : undefined}
            aria-label="Debug"
          >
            <span className="agent-btn-icon" aria-hidden="true"><Activity size={16} /></span>
            <span className="agent-btn-label">Debug</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            VideoRAG &middot; Gemini 2.5 Pro<br />Prototype &middot; v0.3
          </div>
        </div>
      </aside>

      <main className="main">
        {view === "chat" && <ChatView clientId={clientId} />}
        {view === "ingest" && <IngestView clientId={clientId} />}
        {view === "debug" && <DebugView clientId={clientId} />}
      </main>
    </div>
  );
}
