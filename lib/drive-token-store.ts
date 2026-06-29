// Singleton para compartilhar o access token do Drive entre hooks.
// O token é válido por ~1h; após expirar o upload falha silenciosamente
// até o usuário clicar "Reconectar" na Biblioteca.

let _token: string | null = null;
let _baseFolderId: string | null = null;

export function setDriveBaseAccess(token: string, folderId: string) {
  _token = token;
  _baseFolderId = folderId;
}

export function getDriveBaseAccess(): { token: string; folderId: string } | null {
  if (!_token || !_baseFolderId) return null;
  return { token: _token, folderId: _baseFolderId };
}

export function clearDriveBaseAccess() {
  _token = null;
  _baseFolderId = null;
}
