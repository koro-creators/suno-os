import { useState, useRef, useEffect, useCallback } from "react";
import { Film } from "lucide-react";
import { AGENTS, API_BASE, FALLBACKS } from "../config";
import { parseMarkdown } from "../helpers/markdown";
import useUpload from "../hooks/useUpload";
import { AttachButton, AttachmentPreviews } from "../components/chat/ChatAttachment";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import { validateVideoFile, generateThumbnail, formatFileSize } from "../helpers/video";
import SecondaryResponses from "../components/chat/SecondaryResponses";
import PipelineProgress from "../components/chat/PipelineProgress";
import "./ChatView.css";

function LoadingDots() {
  return (
    <div className="loading-dots" role="status" aria-label="Carregando resposta">
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  );
}

export default function ChatView({ clientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `${clientId}:user-${Date.now()}`);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [lastAgent, setLastAgent] = useState("videorag");
  const [traceInfo, setTraceInfo] = useState(null);

  const { queueRef: uploadQueueRef, addFiles: uploadFiles } = useUpload();

  const endRef = useRef(null);
  const inputRef = useRef(null);

  const currentAgent = AGENTS.find(a => a.id === lastAgent) || AGENTS[0];
  const isVideoRAG = lastAgent === "videorag";

  useEffect(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: lastAgent, content: currentAgent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    setPendingFiles([]);
    inputRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally reset only on client change
  }, [clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetChat = useCallback(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: lastAgent, content: currentAgent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    setPendingFiles([]);
  }, [lastAgent, currentAgent, clientId]);

  // --- Attachment handlers ---
  const handleAttachFiles = async (fileList) => {
    const files = Array.from(fileList);
    const items = [];
    for (const f of files) {
      const validation = validateVideoFile(f);
      if (!validation.valid) continue;
      const thumb = await generateThumbnail(f);
      items.push({ id: crypto.randomUUID(), file: f, fileName: f.name, fileSize: f.size, thumbnailUrl: thumb });
    }
    setPendingFiles((prev) => [...prev, ...items]);
  };

  const removePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // --- SSE reader helper ---
  const readSSEStream = async (res, asstId) => {
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
          if (p.type === "trace_pipeline") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? { ...m, pipeline: p.stages, isPipeline: true } : m
            ));
          } else if (p.type === "trace_stage_start") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                currentStage: { stage: p.stage, label: p.label, agents: p.agents, is_primary: p.is_primary },
                pipelineStages: [...(m.pipelineStages || []),
                  { stage: p.stage, label: p.label, agents: p.agents, status: "running" }
                ],
              } : m
            ));
          } else if (p.type === "trace_stage_end") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                pipelineStages: (m.pipelineStages || []).map(s =>
                  s.stage === p.stage ? { ...s, status: "done" } : s
                ),
              } : m
            ));
          } else if (p.type === "trace_stage_agent") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                stageAgents: [...(m.stageAgents || []),
                  { agent_id: p.agent_id, status: p.status, summary: p.summary, duration_ms: p.duration_ms }
                ].filter((v, i, a) =>
                  a.findIndex(x => x.agent_id === v.agent_id && x.status === v.status) === i
                ),
              } : m
            ));
          } else if (p.type === "trace_classify" || p.type === "trace_classify_fallback") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? { ...m, classification: p } : m
            ));
          } else if (p.type === "trace_context") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                contextAgents: [...(m.contextAgents || []),
                  { agent_id: p.agent_id, status: p.status, summary: p.summary }
                ].filter((v, i, a) =>
                  a.findIndex(x => x.agent_id === v.agent_id && x.status === v.status) === i
                ),
              } : m
            ));
          } else if (p.type === "trace_secondary") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                secondaryResponses: [...(m.secondaryResponses || []),
                  { agent_id: p.agent_id, content: p.content }
                ],
              } : m
            ));
          } else if (p.type === "trace_start") {
            if (p.is_primary) {
              setMessages(prev => prev.map(m =>
                m.id === asstId ? { ...m, agentId: p.agent_id } : m
              ));
            }
            setTraceInfo({
              agentId: p.agent_id, qdrantHits: p.qdrant_hits,
              contextChunks: p.context_chunks, startTime: Date.now(), status: "streaming",
            });
          } else if (p.type === "trace_end") {
            setTraceInfo(prev => prev ? {
              ...prev, status: "done",
              tokensIn: p.tokens_in, tokensOut: p.tokens_out, durationMs: p.duration_ms,
            } : null);
          } else if (p.type === "trace_tool_call") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                toolCalls: [...(m.toolCalls || []),
                  { agent_id: p.agent_id, tool: p.tool, input: p.input, status: "running" }
                ],
              } : m
            ));
          } else if (p.type === "trace_tool_result") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                toolCalls: (m.toolCalls || []).map(tc =>
                  tc.tool === p.tool && tc.status === "running"
                    ? { ...tc, status: "done", result_preview: p.result_preview }
                    : tc
                ),
              } : m
            ));
          } else if (p.type === "trace_refinement") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                refinements: [...(m.refinements || []),
                  { agent_id: p.agent_id, query: p.query, iteration: p.iteration, status: "running" }
                ],
              } : m
            ));
          } else if (p.type === "trace_refinement_done") {
            setMessages(prev => prev.map(m =>
              m.id === asstId ? {
                ...m,
                refinements: (m.refinements || []).map(r =>
                  r.agent_id === p.agent_id && r.status === "running"
                    ? { ...r, status: "done", summary: p.summary }
                    : r
                ),
              } : m
            ));
          } else if (p.type === "trace_error") {
            setTraceInfo(prev => prev ? {
              ...prev, status: "error", error: p.error, durationMs: p.duration_ms,
            } : null);
          } else if (p.text) {
            full += p.text;
            const snap = full;
            setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, content: snap } : m)));
          }
        } catch { /* ignore parse errors */ }
      }
    }
    setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
  };

  // --- Simulate stream for fallback ---
  const simulateStream = async (full, asstId) => {
    const words = full.split(" ");
    let built = "";
    for (let i = 0; i < words.length; i++) {
      built += (i > 0 ? " " : "") + words[i];
      if (i % 2 === 0) {
        const snap = built;
        setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, content: snap } : m)));
        await new Promise((r) => setTimeout(r, 16));
      }
    }
    setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, content: full, streaming: false } : m)));
  };

  // --- Send agent chat ---
  const sendAgentChat = async (text) => {
    // Parse @mention
    const mentionMatch = text.match(/^@(videorag|copy|persona|roteiro|brief)\s/i);
    let agentId = lastAgent;
    let cleanText = text;
    if (mentionMatch) {
      agentId = mentionMatch[1].toLowerCase();
      cleanText = text.slice(mentionMatch[0].length);
      setLastAgent(agentId);
    }

    setLoading(true);
    setTraceInfo(null);

    const asstId = Date.now() + 100;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true, agentId };
    setMessages((p) => [...p, asstMsg]);

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          client_id: clientId,
          ...(mentionMatch ? { agent_id: agentId } : {}),
          message: cleanText,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await readSSEStream(res, asstId);
    } catch {
      await simulateStream(FALLBACKS[agentId] || "Erro ao conectar.", asstId);
    }
  };

  // --- Main send function ---
  const send = async () => {
    const hasText = input.trim();
    const hasFiles = pendingFiles.length > 0;
    if ((!hasText && !hasFiles) || loading) return;

    const text = hasText ? input.trim() : (hasFiles ? "Analise este vídeo em detalhes" : "");
    setInput("");
    setLoading(true);

    if (hasFiles && isVideoRAG) {
      // Upload flow
      const filesToUpload = [...pendingFiles];
      setPendingFiles([]);

      const fileNames = filesToUpload.map((f) => f.fileName).join(", ");
      const userMsg = { id: Date.now(), role: "user", content: `${text}\n📎 ${fileNames}` };
      setMessages((p) => [...p, userMsg]);

      // Add upload progress messages
      const uploadMsgIds = [];
      const uploadMsgs = filesToUpload.map((f, i) => {
        const msgId = Date.now() + i + 1;
        uploadMsgIds.push(msgId);
        return {
          id: msgId,
          role: "upload-progress",
          fileName: f.fileName,
          fileSize: formatFileSize(f.fileSize),
          progress: 0,
          uploadStatus: "queued",
        };
      });
      setMessages((p) => [...p, ...uploadMsgs]);

      // Upload files
      const fileList = new DataTransfer();
      filesToUpload.forEach((f) => fileList.items.add(f.file));
      uploadFiles(fileList.files, clientId, "");

      // Wait for completion using ref (avoids stale closure)
      await new Promise((resolve) => {
        const check = () => {
          const current = uploadQueueRef.current;
          const relevant = current.filter(
            (item) => filesToUpload.some((f) => f.fileName === item.fileName)
          );
          const allDone = relevant.length > 0 && relevant.every(
            (item) => item.status === "completed" || item.status === "error"
          );
          if (allDone) {
            clearInterval(interval);
            relevant.forEach((item, i) => {
              if (uploadMsgIds[i]) {
                setMessages((p) => p.map((m) =>
                  m.id === uploadMsgIds[i]
                    ? { ...m, progress: item.progress, uploadStatus: item.status }
                    : m
                ));
              }
            });
            resolve();
          }
        };
        const interval = setInterval(check, 1000);
        check();
        setTimeout(() => { clearInterval(interval); resolve(); }, 600000);
      });

      // Update all upload messages to completed
      uploadMsgIds.forEach((msgId) => {
        setMessages((p) => p.map((m) =>
          m.id === msgId ? { ...m, progress: 100, uploadStatus: "completed" } : m
        ));
      });

      // Send agent message with video prefix
      const videoPrefix = filesToUpload.map((f) => `[Video: ${f.fileName}]`).join(" ");
      await sendAgentChat(`${videoPrefix} ${text}`);

      setLoading(false);
      inputRef.current?.focus();
      return;
    }

    // Normal text-only send
    // Parse @mention
    const mentionMatch = text.match(/^@(videorag|copy|persona|roteiro|brief)\s/i);
    let agentId = lastAgent;
    let cleanText = text;
    if (mentionMatch) {
      agentId = mentionMatch[1].toLowerCase();
      cleanText = text.slice(mentionMatch[0].length);
      setLastAgent(agentId);
    }
    setTraceInfo(null);

    const userMsg = { id: Date.now(), role: "user", content: text }; // Show original text with @mention
    const asstId = Date.now() + 1;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true, agentId };
    setMessages((p) => [...p, userMsg, asstMsg]);

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          client_id: clientId,
          ...(mentionMatch ? { agent_id: agentId } : {}),
          message: cleanText,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await readSSEStream(res, asstId);
    } catch {
      await simulateStream(FALLBACKS[agentId] || "Erro ao conectar.", asstId);
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

  return (
    <>
      <header className="chat-header">
        <div>
          <div className="chat-header-info">
            <span className="chat-header-title">Chat</span>
            <span className="chat-header-client">{clientId.toUpperCase()}</span>
          </div>
          <div className="chat-header-hint">{currentAgent.hint}</div>
        </div>
        <button className="btn-clear" onClick={resetChat} aria-label="Limpar conversa">
          limpar
        </button>
      </header>

      <div className="messages" role="log" aria-live="polite" aria-label="Mensagens da conversa">
        <div className="messages-inner">
          {messages.map((msg) => {
            if (msg.role === "system-greeting") {
              return (
                <div key={msg.id} className="msg-greeting">
                  <div className="msg-greeting-label">{currentAgent.label.toUpperCase()}</div>
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
            if (msg.role === "upload-progress") {
              return (
                <div key={msg.id} className="chat-upload-card">
                  <div className="chat-upload-card-header">
                    <Film size={14} />
                    <span className="chat-upload-card-name">{msg.fileName}</span>
                    <span className="chat-upload-card-size">{msg.fileSize}</span>
                  </div>
                  <ProgressBar progress={msg.progress} status={msg.uploadStatus} />
                  <div className="chat-upload-card-status">
                    <StatusBadge status={msg.uploadStatus} />
                  </div>
                </div>
              );
            }
            if (msg.role === "assistant") {
              const agentInfo = AGENTS.find(a => a.id === msg.agentId);
              return (
                <article key={msg.id} className="msg-assistant">
                  {msg.agentId && (
                    <span className="agent-badge" style={{ '--agent-color': agentInfo?.color || '#888' }}>
                      {agentInfo?.label || msg.agentId}
                    </span>
                  )}
                  <div className="msg-label">{agentInfo?.label?.toUpperCase() || 'ASSISTENTE'}</div>
                  {msg.content ? (
                    <div className="msg-assistant-content">
                      <p
                        dangerouslySetInnerHTML={{
                          __html:
                            parseMarkdown(msg.content) +
                            (msg.streaming ? '<span class="msg-cursor" aria-hidden="true"></span>' : ""),
                        }}
                      />
                      {msg.pipelineStages && (
                        <PipelineProgress stages={msg.pipelineStages} stageAgents={msg.stageAgents} />
                      )}
                      {msg.secondaryResponses && (
                        <SecondaryResponses responses={msg.secondaryResponses} />
                      )}
                    </div>
                  ) : (
                    <LoadingDots />
                  )}
                </article>
              );
            }
            return null;
          })}
          {traceInfo && (
            <div className={`execution-card ${traceInfo.status}`}>
              <span className="execution-agent">
                {AGENTS.find(a => a.id === traceInfo.agentId)?.label || traceInfo.agentId}
              </span>
              {traceInfo.status === "streaming" && (
                <span className="execution-status">gerando resposta...</span>
              )}
              {traceInfo.status === "done" && (
                <>
                  <span className="execution-duration">{(traceInfo.durationMs / 1000).toFixed(1)}s</span>
                  <span className="execution-tokens">{traceInfo.tokensIn + traceInfo.tokensOut} tokens</span>
                  {traceInfo.contextChunks > 0 && (
                    <span className="execution-context">{traceInfo.contextChunks} chunks</span>
                  )}
                </>
              )}
              {traceInfo.status === "error" && (
                <span className="execution-error">{traceInfo.error}</span>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="chat-input">
        <div className="chat-input-inner">
          {pendingFiles.length > 0 && (
            <AttachmentPreviews files={pendingFiles} onRemove={removePendingFile} />
          )}
          <div className="chat-input-row" data-active={loading}>
            <AttachButton onFiles={handleAttachFiles} visible={isVideoRAG} />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentAgent.placeholder}
              rows={1}
              className="chat-textarea"
              aria-label="Sua mensagem"
            />
            <button
              className="btn-send"
              onClick={send}
              disabled={loading || (!input.trim() && pendingFiles.length === 0)}
              aria-label="Enviar mensagem"
            >
              Enviar
            </button>
          </div>
          <div className="chat-input-hint">
            <kbd>Enter</kbd> enviar &middot; <kbd>Shift+Enter</kbd> nova linha
          </div>
          <div className="agent-chips">
            {AGENTS.map(a => {
              const mentionActive = input.toLowerCase().startsWith(`@${a.id} `);
              const isDefault = !input.match(/^@\w/) && lastAgent === a.id;
              return (
                <button
                  key={a.id}
                  className={`agent-chip ${mentionActive || isDefault ? 'active' : ''}`}
                  style={{ '--agent-color': a.color }}
                  onClick={() => {
                    if (mentionActive) {
                      // Remove @mention to go back to multi-agent mode
                      setInput(input.replace(/^@\w+\s*/i, ''));
                    } else {
                      // Insert @mention for direct agent addressing
                      const cleaned = input.replace(/^@\w+\s*/i, '');
                      setInput(`@${a.id} ${cleaned}`);
                    }
                    inputRef.current?.focus();
                  }}
                  title={mentionActive ? "Clique para remover @mention (modo multi-agente)" : `@${a.id} — endereçar diretamente`}
                >
                  {a.label}
                </button>
              );
            })}
            <span style={{ fontSize: 10, color: "#555", marginLeft: 4 }}>
              {input.match(/^@\w/) ? "modo direto" : "auto"}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
