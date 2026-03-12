import { useState } from "react";
import { HardDrive } from "lucide-react";
import useUpload from "../hooks/useUpload";
import useIngestStatus from "../hooks/useIngestStatus";
import UploadZone from "../components/upload/UploadZone";
import UploadQueue from "../components/upload/UploadQueue";
import VideoCard from "../components/upload/VideoCard";
import "./IngestView.css";

export default function IngestView({ clientId }) {
  const [campaignName, setCampaignName] = useState("");
  const { queue, addFiles, cancelItem, retryItem } = useUpload();
  const { videos, error, refresh } = useIngestStatus(clientId);

  const handleFiles = (files) => {
    addFiles(files, clientId, campaignName);
  };

  const completedVideos = videos.filter((v) => v.status === "completed");
  const processingVideos = videos.filter((v) => v.status === "processing" || v.status === "queued");
  const errorVideos = videos.filter((v) => v.status === "error");

  const totalIndexed = completedVideos.length;
  const totalProcessing = processingVideos.length + queue.filter((i) => i.status !== "completed" && i.status !== "error").length;

  return (
    <div className="ingest-view">
      <header className="ingest-header">
        <div className="ingest-header-info">
          <span className="ingest-header-title">Ingestão de Vídeos</span>
          <span className="ingest-header-client">{clientId.toUpperCase()}</span>
        </div>
        <div className="ingest-header-stats">
          {totalIndexed} vídeo{totalIndexed !== 1 ? "s" : ""} indexado{totalIndexed !== 1 ? "s" : ""}
          {totalProcessing > 0 && ` · ${totalProcessing} em processamento`}
        </div>
      </header>

      <div className="ingest-content">
        <div className="ingest-content-inner">
          <UploadZone onFiles={handleFiles} />

          <div className="ingest-campaign-row">
            <span className="ingest-campaign-label">Campanha</span>
            <input
              className="ingest-campaign-input"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Nome da campanha (opcional)"
            />
          </div>

          <UploadQueue items={queue} onCancel={cancelItem} onRetry={retryItem} />

          {error && (
            <div className="ingest-error-banner">
              <span>{error}</span>
              <button onClick={refresh}>Tentar novamente</button>
            </div>
          )}

          {(completedVideos.length > 0 || errorVideos.length > 0) && (
            <>
              <div className="ingest-section-header">
                Vídeos Indexados ({completedVideos.length + errorVideos.length})
              </div>
              <div className="ingest-video-list">
                {errorVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
                {completedVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
              </div>
            </>
          )}

          {processingVideos.length > 0 && (
            <>
              <div className="ingest-section-header">
                Em Processamento ({processingVideos.length})
              </div>
              <div className="ingest-video-list">
                {processingVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
              </div>
            </>
          )}

          <div className="ingest-drive-placeholder">
            <span className="ingest-drive-label">
              <HardDrive size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Google Drive
            </span>
            <button className="ingest-drive-btn" disabled title="Em breve">
              Conectar Pasta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
