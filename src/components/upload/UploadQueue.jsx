import VideoCard from "./VideoCard";
import "./upload.css";

export default function UploadQueue({ items, onCancel, onRetry }) {
  if (items.length === 0) return null;

  const active = items.filter((i) => i.status !== "completed");
  const completed = items.filter((i) => i.status === "completed");

  return (
    <div className="upload-queue">
      {active.length > 0 && (
        <>
          <div className="upload-queue-header">
            Fila de Upload ({active.length})
          </div>
          {active.map((item) => (
            <VideoCard key={item.id} item={item} onCancel={onCancel} onRetry={onRetry} />
          ))}
        </>
      )}
      {completed.length > 0 && (
        <>
          <div className="upload-queue-header">
            Enviados ({completed.length})
          </div>
          {completed.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </>
      )}
    </div>
  );
}
