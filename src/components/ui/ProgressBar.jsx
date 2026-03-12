import "./ui.css";

const STATUS_COLORS = {
  queued: "var(--color-status-queued)",
  uploading: "var(--color-status-uploading)",
  processing: "var(--color-status-processing)",
  completed: "var(--color-status-completed)",
  error: "var(--color-status-error)",
};

export default function ProgressBar({ progress = 0, status = "queued" }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.queued;
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="progress-bar-fill"
        data-status={status}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
      />
    </div>
  );
}
