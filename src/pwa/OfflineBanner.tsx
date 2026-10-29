import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/** Informativo, no bloqueante: la app funciona igual sin red. */
export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div className="shrink-0 px-4 pb-2">
      <p
        role="status"
        className="rounded-control border border-border bg-surface px-3 py-2 text-center text-[11.5px] text-muted"
      >
        Sin conexión · tus notas se guardan igual
      </p>
    </div>
  );
}
