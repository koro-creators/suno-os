import "./ui.css";

const STATUS_LABELS = {
  queued: "Na fila",
  uploading: "Enviando",
  processing: "Processando",
  completed: "Concluído",
  error: "Erro",
};

export default function StatusBadge({ status = "queued", label }) {
  return (
    <span className="status-badge" data-status={status}>
      <span className="status-badge-dot" data-status={status} />
      <span className="status-badge-label">{label || STATUS_LABELS[status]}</span>
    </span>
  );
}
