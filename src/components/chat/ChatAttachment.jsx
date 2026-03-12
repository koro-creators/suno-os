import { useRef } from "react";
import { Paperclip, X, Film } from "lucide-react";
import { formatFileSize } from "../../helpers/video";
import "./chat-attachment.css";

export function AttachButton({ onFiles, visible }) {
  const inputRef = useRef(null);

  if (!visible) return null;

  const handleChange = (e) => {
    if (e.target.files.length > 0) onFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <>
      <button className="chat-attachment-btn" onClick={() => inputRef.current?.click()} aria-label="Anexar vídeo">
        <Paperclip size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </>
  );
}

export function AttachmentPreviews({ files, onRemove }) {
  if (files.length === 0) return null;

  return (
    <div className="chat-attachment-previews">
      {files.map((f) => (
        <div key={f.id} className="chat-attachment-preview">
          {f.thumbnailUrl ? (
            <img src={f.thumbnailUrl} alt="" className="chat-attachment-preview-thumb" />
          ) : (
            <Film size={14} style={{ color: "var(--color-subtle)" }} />
          )}
          <span className="chat-attachment-preview-name" title={f.fileName}>{f.fileName}</span>
          <span className="chat-attachment-preview-size">{formatFileSize(f.fileSize)}</span>
          <button className="chat-attachment-preview-remove" onClick={() => onRemove(f.id)} aria-label="Remover">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
