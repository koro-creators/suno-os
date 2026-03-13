import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { API_BASE, AGENTS } from "../config";
import "./DebugView.css";

const AGENT_COLOR_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a.color]));
const AGENT_LABEL_MAP = Object.fromEntries(AGENTS.map((a) => [a.id, a.label]));
const COST_PER_M_IN = 3;
const COST_PER_M_OUT = 15;
const REFRESH_INTERVAL = 10000;

function Loading() {
  return (
    <div className="debug-loading" role="status" aria-label="Carregando">
      <div className="debug-loading-dot" />
      <div className="debug-loading-dot" />
      <div className="debug-loading-dot" />
    </div>
  );
}

function estimateCost(tokensIn, tokensOut) {
  return ((tokensIn * COST_PER_M_IN + tokensOut * COST_PER_M_OUT) / 1_000_000).toFixed(4);
}

function truncateId(id) {
  if (!id) return "";
  if (id.length <= 20) return id;
  return id.slice(0, 10) + "..." + id.slice(-7);
}

export default function DebugView({ clientId }) {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [checkpointer, setCheckpointer] = useState(null);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const intervalRef = useRef(null);
  const [prevClientId, setPrevClientId] = useState(clientId);

  // Render-time reset when clientId changes (React-recommended pattern)
  if (clientId !== prevClientId) {
    setPrevClientId(clientId);
    setThreads([]);
    setSelectedId(null);
    setDetail(null);
    setThreadsLoading(true);
  }

  // Fetch debug status (checkpointer type)
  useEffect(() => {
    fetch(`${API_BASE}/debug/status`)
      .then((r) => r.json())
      .then((d) => setCheckpointer(d.checkpointer || null))
      .catch(() => setCheckpointer(null));
  }, []);

  // Fetch thread list (includes loading state to avoid setState in effect body)
  const fetchThreads = useCallback(() => {
    setThreadsLoading(true);
    setThreadsError(null);
    fetch(`${API_BASE}/debug/threads?client_id=${clientId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setThreads(data);
        setThreadsLoading(false);
      })
      .catch((e) => {
        setThreadsError(e.message);
        setThreadsLoading(false);
      });
  }, [clientId]);

  useEffect(() => {
    fetchThreads(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetching pattern
    intervalRef.current = setInterval(fetchThreads, REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchThreads]);

  // Fetch thread detail on selection
  const fetchDetail = useCallback((threadId) => {
    setDetailLoading(true);
    setDetailError(null);
    fetch(`${API_BASE}/debug/thread/${threadId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDetail(data);
        setDetailLoading(false);
      })
      .catch((e) => {
        setDetailError(e.message);
        setDetailLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchDetail(selectedId); // eslint-disable-line react-hooks/set-state-in-effect -- data fetching pattern
  }, [selectedId, fetchDetail]);

  // Compute max duration for timeline bar scaling
  const maxDuration =
    detail?.trace?.reduce((max, t) => Math.max(max, t.duration_ms || 0), 0) || 1;

  return (
    <div className="debug-view">
      {/* Header */}
      <header className="debug-header">
        <div className="debug-header-info">
          <span className="debug-header-title">Debug</span>
          <span className="debug-header-client">{clientId.toUpperCase()}</span>
        </div>
      </header>

      {/* MemorySaver Banner */}
      {checkpointer === "memory" && (
        <div className="debug-memory-banner" role="status">
          <AlertTriangle size={14} className="debug-memory-banner-icon" />
          <span>Dados disponíveis apenas da sessão atual do servidor.</span>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="debug-panels">
        {/* Panel 1 — Thread List */}
        <div className="debug-panel-threads">
          <div className="debug-panel-label">Threads</div>
          {threadsLoading ? (
            <Loading />
          ) : threadsError ? (
            <div className="debug-error-state">{threadsError}</div>
          ) : threads.length === 0 ? (
            <div className="debug-empty-state">Nenhuma thread encontrada</div>
          ) : (
            <div className="debug-thread-list">
              {threads.map((t) => (
                <button
                  key={t.thread_id}
                  className="debug-thread-item"
                  data-active={selectedId === t.thread_id}
                  onClick={() => setSelectedId(t.thread_id)}
                  aria-current={selectedId === t.thread_id ? "true" : undefined}
                >
                  <span className="debug-thread-id">{truncateId(t.thread_id)}</span>
                  <div className="debug-thread-meta">
                    <span className="debug-thread-turns">{t.turn_count} turns</span>
                    <span className="debug-thread-agents">
                      {(t.agents_used || []).map((agentId) => (
                        <span
                          key={agentId}
                          className="debug-agent-dot"
                          style={{ background: AGENT_COLOR_MAP[agentId] || "#888" }}
                          title={AGENT_LABEL_MAP[agentId] || agentId}
                        />
                      ))}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2 — Graph + Timeline */}
        <div className="debug-panel-center">
          {!selectedId ? (
            <div className="debug-empty-state">Selecione uma thread para inspecionar</div>
          ) : detailLoading ? (
            <Loading />
          ) : detailError ? (
            <div className="debug-error-state">{detailError}</div>
          ) : detail ? (
            <div className="debug-center-content">
              {/* Graph */}
              <div className="debug-graph">
                <div className="debug-panel-label">Grafo de Execução</div>
                <div className="debug-graph-flow">
                  <span
                    className="debug-graph-node"
                    data-status="success"
                  >
                    START
                  </span>
                  {(detail.trace || []).map((entry, i) => {
                    const hasError = !!entry.error;
                    const status = hasError ? "error" : "success";
                    const agentColor = AGENT_COLOR_MAP[entry.agent_id] || "#888";
                    return (
                      <span key={i} style={{ display: "contents" }}>
                        <span className="debug-graph-arrow" aria-hidden="true">→</span>
                        <span
                          className="debug-graph-node"
                          data-status={status}
                          style={{ borderColor: `${agentColor}50`, color: agentColor, background: `${agentColor}14` }}
                        >
                          {AGENT_LABEL_MAP[entry.agent_id] || entry.agent_id}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="debug-timeline">
                <div className="debug-panel-label">Timeline</div>
                {(detail.trace || []).map((entry, i) => {
                  const agentColor = AGENT_COLOR_MAP[entry.agent_id] || "#888";
                  const pct = maxDuration > 0 ? ((entry.duration_ms || 0) / maxDuration) * 100 : 0;
                  const tokens = (entry.tokens_in || 0) + (entry.tokens_out || 0);
                  return (
                    <div key={i} className="debug-timeline-row">
                      <span className="debug-timeline-agent" style={{ color: agentColor }}>
                        {AGENT_LABEL_MAP[entry.agent_id] || entry.agent_id}
                      </span>
                      <div className="debug-timeline-bar-wrap">
                        <div
                          className="debug-timeline-bar"
                          style={{ width: `${Math.max(pct, 2)}%`, background: agentColor }}
                        />
                      </div>
                      <div className="debug-timeline-stats">
                        <span>{((entry.duration_ms || 0) / 1000).toFixed(1)}s</span>
                        <span>{tokens} tok</span>
                      </div>
                    </div>
                  );
                })}
                {(detail.trace || []).length === 0 && (
                  <div className="debug-empty-state">Sem dados de trace</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Panel 3 — Metrics */}
        <div className="debug-panel-metrics">
          <div className="debug-panel-label">Métricas</div>
          {!selectedId || !detail ? (
            <div className="debug-empty-state">—</div>
          ) : (
            <div className="debug-metrics-content">
              <div className="debug-metric-card">
                <div className="debug-metric-label">Tokens In</div>
                <div className="debug-metric-value">{(detail.total_tokens_in || 0).toLocaleString()}</div>
              </div>
              <div className="debug-metric-card">
                <div className="debug-metric-label">Tokens Out</div>
                <div className="debug-metric-value">{(detail.total_tokens_out || 0).toLocaleString()}</div>
              </div>
              <div className="debug-metric-card">
                <div className="debug-metric-label">Custo Estimado</div>
                <div className="debug-metric-value">
                  ${estimateCost(detail.total_tokens_in || 0, detail.total_tokens_out || 0)}
                </div>
                <div className="debug-metric-sub">Sonnet 4 ($3/$15 per 1M)</div>
              </div>
              <div className="debug-metric-card">
                <div className="debug-metric-label">Qdrant Chunks</div>
                <div className="debug-metric-value">{detail.qdrant_chunks ?? "—"}</div>
                {detail.avg_qdrant_score != null && (
                  <div className="debug-metric-sub">
                    relevância média: {detail.avg_qdrant_score.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="debug-metric-card">
                <div className="debug-metric-label">Duração Total</div>
                <div className="debug-metric-value">
                  {((detail.total_duration_ms || 0) / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="debug-metric-card">
                <div className="debug-metric-label">Agentes</div>
                <div className="debug-agent-breakdown">
                  {(detail.agents_used || []).map((agentId) => {
                    const agentTrace = (detail.trace || []).filter(
                      (t) => t.agent_id === agentId
                    );
                    const totalMs = agentTrace.reduce(
                      (sum, t) => sum + (t.duration_ms || 0),
                      0
                    );
                    return (
                      <div key={agentId} className="debug-agent-row">
                        <span
                          className="debug-agent-color"
                          style={{ background: AGENT_COLOR_MAP[agentId] || "#888" }}
                        />
                        <span className="debug-agent-name">
                          {AGENT_LABEL_MAP[agentId] || agentId}
                        </span>
                        <span className="debug-agent-time">
                          {(totalMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
