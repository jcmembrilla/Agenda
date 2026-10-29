import { useCallback, useSyncExternalStore } from 'react';
export type AppSection = 'tasks' | 'routine' | 'almanac';

const HASH_BY_SECTION: Record<AppSection, string> = {
  tasks: '#tareas',
  routine: '#rutina',
  almanac: '#almanaque',
};

function readSectionFromHash(): AppSection {
  if (window.location.hash === HASH_BY_SECTION.routine) return 'routine';
  if (window.location.hash === HASH_BY_SECTION.almanac) return 'almanac';
  return 'tasks';
}

function subscribeToHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
}

/**
 * Las pestañas viven en el hash para que el botón Atrás de Android vuelva a
 * la sección anterior en lugar de cerrar la app. Sin router ni dependencias.
 */
export function useHashTab(): [AppSection, (section: AppSection) => void] {
  const section = useSyncExternalStore(subscribeToHash, readSectionFromHash, readSectionFromHash);

  const setSection = useCallback((next: AppSection) => {
    const hash = HASH_BY_SECTION[next];
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  return [section, setSection];
}
