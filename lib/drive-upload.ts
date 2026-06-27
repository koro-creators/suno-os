const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

export async function uploadFileToDrive(
  bytes: Uint8Array,
  filename: string,
  folderId: string,
  token: string,
  mimeType = 'application/pdf',
): Promise<string | null> {
  const metadata = JSON.stringify({ name: filename, parents: [folderId] });

  const boundary = `----DriveUpload${Date.now()}`;
  const delimiter = `--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
  const filePart = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metaBytes = encoder.encode(metaPart);
  const filePartBytes = encoder.encode(filePart);
  const closeBytes = encoder.encode(closeDelimiter);

  const body = new Uint8Array(metaBytes.length + filePartBytes.length + bytes.length + closeBytes.length);
  body.set(metaBytes, 0);
  body.set(filePartBytes, metaBytes.length);
  body.set(bytes, metaBytes.length + filePartBytes.length);
  body.set(closeBytes, metaBytes.length + filePartBytes.length + bytes.length);

  const res = await fetch(DRIVE_UPLOAD_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json() as { webViewLink?: string; id?: string };
  return data.webViewLink ?? null;
}
