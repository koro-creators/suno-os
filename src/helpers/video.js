import { VALID_VIDEO_MIMES, MAX_FILE_SIZE } from "../config";

export function validateVideoFile(file) {
  if (!VALID_VIDEO_MIMES.includes(file.type)) {
    return { valid: false, error: "Formato não suportado. Use MP4, MOV, AVI ou WebM." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Arquivo muito grande. Máximo 500MB." };
  }
  return { valid: true, error: null };
}

export function generateThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.height = 136;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    // Timeout fallback for formats browsers can't play (e.g., AVI)
    setTimeout(() => {
      if (!video.seekable.length) {
        cleanup();
        resolve(null);
      }
    }, 3000);
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
