import { useState } from "react";
import useUpload from "../hooks/useUpload";
import useDriveUpload from "../hooks/useDriveUpload";
import useIngestStatus from "../hooks/useIngestStatus";
import UploadZone from "../components/upload/UploadZone";
import UploadQueue from "../components/upload/UploadQueue";
import DriveButton from "../components/upload/DriveButton";
import VideoCard from "../components/upload/VideoCard";
import "./IngestView.css";

export default function IngestView({ clientId }) {
  const [campaignName, setCampaignName] = useState("");
  const { queue, addFiles, cancelItem, retryItem } = useUpload();
  const { driveQueue, openDrivePicker, cancelDriveItem, retryDriveItem, isPickerLoading } = useDriveUpload();
  const { videos, error, refresh } = useIngestStatus(clientId);

  const handleFiles = (files) => {
    addFiles(files, clientId, campaignName);
  };

  const completedVideos = videos.filter((v) => v.status === "completed");
  const processingVideos = videos.filter((v) => v.status === "processing" || v.status === "queued");
  const errorVideos = videos.filter((v) => v.status === "error");

  const combinedQueue = [...queue, ...driveQueue];

  const totalIndexed = completedVideos.length;
  const totalProcessing = processingVideos.length + combinedQueue.filter((i) => i.status !== "completed" && i.status !== "error").length;

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

          <UploadQueue
            items={combinedQueue}
            onCancel={(id) => {
              const isDrive = driveQueue.some((i) => i.id === id);
              isDrive ? cancelDriveItem(id) : cancelItem(id);
            }}
            onRetry={(id) => {
              const isDrive = driveQueue.some((i) => i.id === id);
              isDrive ? retryDriveItem(id) : retryItem(id);
            }}
          />

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

          <DriveButton
            onPick={() => openDrivePicker(clientId, campaignName)}
            isLoading={isPickerLoading}
          />
        </div>
      </div>
    </div>
  );
}
