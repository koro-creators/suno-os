import { HardDrive, Loader } from "lucide-react";

export default function DriveButton({ onPick, isLoading, disabled }) {
  return (
    <button
      className="ingest-drive-btn"
      onClick={onPick}
      disabled={disabled || isLoading}
      data-loading={isLoading}
    >
      <span className="ingest-drive-btn-icon">
        {isLoading ? <Loader size={20} className="spin" /> : <HardDrive size={20} />}
      </span>
      <span className="ingest-drive-btn-text">
        {isLoading ? "Abrindo Drive..." : "Selecionar do Drive"}
      </span>
    </button>
  );
}
