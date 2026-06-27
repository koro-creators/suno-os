/**
 * Shared script loaders for Google Drive / Picker / GIS.
 *
 * Both useDriveSync and useBaseDriveSync auto-connect on mount simultaneously.
 * Without a shared promise cache, the second caller finds the <script> tag already
 * in the DOM (but still loading) and resolves early — causing gapi.load() to throw
 * before the script is ready. The module-level Maps fix that race.
 */

const _promises = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  if (_promises.has(src)) return _promises.get(src)!;
  const p = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(s);
  });
  _promises.set(src, p);
  return p;
}

let _gapiPromise: Promise<void> | null = null;

export function loadGapi(): Promise<void> {
  if (_gapiPromise) return _gapiPromise;
  _gapiPromise = loadScript('https://apis.google.com/js/api.js').then(
    () => new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gapi.load('picker', resolve);
    }),
  );
  return _gapiPromise;
}

export function loadGis(): Promise<void> {
  return loadScript('https://accounts.google.com/gsi/client');
}
