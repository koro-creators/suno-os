// Singleton para compartilhar o access token do Drive entre hooks.
// O token é válido por ~1h. Persiste no localStorage com TTL de 55min para
// que fique disponível imediatamente mesmo ao navegar entre páginas.

const LS_KEY = 'sunos-drive-base-access';
const TTL_MS = 55 * 60 * 1000; // 55 minutos (tokens expiram em 1h)

interface Stored { token: string; folderId: string; expiresAt: number }

let _token: string | null = null;
let _baseFolderId: string | null = null;

function readFromStorage(): { token: string; folderId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed: Stored = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return { token: parsed.token, folderId: parsed.folderId };
  } catch {
    return null;
  }
}

export function setDriveBaseAccess(token: string, folderId: string) {
  _token = token;
  _baseFolderId = folderId;
  try {
    const payload: Stored = { token, folderId, expiresAt: Date.now() + TTL_MS };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch { /* storage indisponível — continua sem persistência */ }
}

export function getDriveBaseAccess(): { token: string; folderId: string } | null {
  if (_token && _baseFolderId) return { token: _token, folderId: _baseFolderId };
  // Fallback: ler do localStorage (disponível logo na carga da página)
  const stored = readFromStorage();
  if (stored) {
    _token = stored.token;
    _baseFolderId = stored.folderId;
    return stored;
  }
  return null;
}

export function clearDriveBaseAccess() {
  _token = null;
  _baseFolderId = null;
  try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
}
