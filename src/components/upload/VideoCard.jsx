import { Play, Film, X, RotateCcw } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";
import StatusBadge from "../ui/StatusBadge";
import { formatFileSize } from "../../helpers/video";
import "./upload.css";

export default function VideoCard({ item, onCancel, onRetry }) {
  const showCancel = item.status === "queued" || item.status === "uploading";
  const showRetry = item.status === "error";
  const showProgress = item.status === "uploading" || item.status === "processing";
  const chunksInfo = item.chunks_indexed ? ` · ${item.chunks_indexed} chunks` : "";

  return (
    <div className="video-card" data-status={item.status}>
      <div className="video-card-thumb">
        {item.thumbnailUrl ? (
          <>
            <img src={item.thumbnailUrl} alt="" />
            <div className="video-card-thumb-overlay">
              <Play size={20} />
            </div>
          </>
        ) : (
          <span className="video-card-thumb-placeholder">
            <Film size={24} />
          </span>
        )}
      </div>

      <div className="video-card-body">
        <div className="video-card-name" title={item.fileName || item.video}>
          {item.fileName || item.video}
        </div>
        <div className="video-card-meta">
          {item.campaignName || item.campaign_name || ""}
          {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : item.size_mb ? ` · ${item.size_mb} MB` : ""}
          {chunksInfo}
        </div>
        {showProgress && <ProgressBar progress={item.progress} status={item.status} />}
        {item.error && <div className="video-card-error">{item.error}</div>}
      </div>

      <div className="video-card-actions">
        <StatusBadge status={item.status} />
        {showCancel && onCancel && (
          <button className="video-card-btn video-card-btn-cancel" onClick={() => onCancel(item.id)} aria-label="Cancelar">
            <X size={14} />
          </button>
        )}
        {showRetry && onRetry && (
          <button className="video-card-btn" onClick={() => onRetry(item.id)} aria-label="Tentar novamente">
            <RotateCcw size={12} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
