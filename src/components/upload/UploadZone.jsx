import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import "./upload.css";

export default function UploadZone({ onFiles, disabled = false }) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragover(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragover(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragover(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) onFiles(files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      className="upload-zone"
      data-dragover={dragover}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Zona de upload de vídeos"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <div className="upload-zone-icon">
        <Upload size={32} />
      </div>
      <div className="upload-zone-title">
        {dragover ? "Solte para enviar" : "Arraste vídeos aqui ou clique para selecionar"}
      </div>
      <div className="upload-zone-hint">MP4, MOV, AVI, WebM · Máx 500MB por arquivo</div>
    </div>
  );
}
