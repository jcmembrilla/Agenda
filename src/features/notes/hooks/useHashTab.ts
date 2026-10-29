import { useCallback, useSyncExternalStore } from 'react';
import type { NoteStatus } from '../notes.types';

const HASH_BY_STATUS: Record<NoteStatus, string> = {
  pending: '#pendientes',
  done: '#realizadas',
};

function readStatusFromHash(): NoteStatus {
  return window.location.hash === HASH_BY_STATUS.done ? 'done' : 'pending';
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

/**
 * Las pestañas viven en el hash para que el botón Atrás de Android vuelva a
 * Pendientes en lugar de cerrar la app. Sin router: 30 líneas y 0 KB.
 */
export function useHashTab(): [NoteStatus, (status: NoteStatus) => void] {
  const status = useSyncExternalStore(subscribeToHash, readStatusFromHash, readStatusFromHash);

  const setStatus = useCallback((next: NoteStatus) => {
    const hash = next === 'done' ? HASH_BY_STATUS.done : HASH_BY_STATUS.pending;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  return [status, setStatus];
}
