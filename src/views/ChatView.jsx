import { useState, useRef, useEffect, useCallback } from "react";
import { Film } from "lucide-react";
import { API_BASE, FALLBACKS } from "../config";
import { parseMarkdown } from "../helpers/markdown";
import useUpload from "../hooks/useUpload";
import { AttachButton, AttachmentPreviews } from "../components/chat/ChatAttachment";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import { validateVideoFile, generateThumbnail, formatFileSize } from "../helpers/video";
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

export default function ChatView({ agent, clientId, AgentIcon }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `${clientId}:user-${Date.now()}`);
  const [pendingFiles, setPendingFiles] = useState([]);

  const { queue: uploadQueue, addFiles: uploadFiles } = useUpload();

  const endRef = useRef(null);
  const inputRef = useRef(null);

  const isVideoRAG = agent.id === "videorag";

  useEffect(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: agent.id, content: agent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    setPendingFiles([]);
    inputRef.current?.focus();
  }, [agent, clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetChat = useCallback(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: agent.id, content: agent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    setPendingFiles([]);
  }, [agent, clientId]);

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
          if (p.text) {
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
    const asstId = Date.now() + 100;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true };
    setMessages((p) => [...p, asstMsg]);

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, client_id: clientId, agent_id: agent.id, message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await readSSEStream(res, asstId);
    } catch {
      await simulateStream(FALLBACKS[agent.id] || "Erro ao conectar.", asstId);
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

      // Wait for completion by watching queue changes
      await new Promise((resolve) => {
        const check = () => {
          const relevant = uploadQueue.filter(
            (item) => filesToUpload.some((f) => f.fileName === item.fileName)
          );
          const allDone = relevant.length > 0 && relevant.every(
            (item) => item.status === "completed" || item.status === "error"
          );
          if (allDone) {
            // Update progress messages
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
        check();
        const interval = setInterval(() => check(), 1000);
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
    const userMsg = { id: Date.now(), role: "user", content: text };
    const asstId = Date.now() + 1;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true };
    setMessages((p) => [...p, userMsg, asstMsg]);

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
      await readSSEStream(res, asstId);
    } catch {
      await simulateStream(FALLBACKS[agent.id] || "Erro ao conectar.", asstId);
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
            <span className="chat-header-title">{agent.label}</span>
            <span className="chat-header-client">{clientId.toUpperCase()}</span>
          </div>
          <div className="chat-header-hint">{agent.hint}</div>
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
                            (msg.streaming ? '<span class="msg-cursor" aria-hidden="true"></span>' : ""),
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
              placeholder={agent.placeholder}
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
        </div>
      </footer>
    </>
  );
}
