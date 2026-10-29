import { useLiveQuery } from 'dexie-react-hooks';
import { notesRepository, type NoteCounts } from '../notes.repository';
import type { Note, NoteStatus } from '../notes.types';

export interface NotesSnapshot {
  /** `undefined` = primer resultado pendiente; `[]` = lista vacía. */
  notes: Note[] | undefined;
  counts: NoteCounts | undefined;
}

/**
 * Proyección reactiva de IndexedDB. No hay estado paralelo: escribir en la base
 * actualiza esta vista (y la de cualquier otra pestaña abierta).
 *
 * Los errores de lectura se propagan durante el render y los captura el
 * `ErrorBoundary` raíz (ver architecture.md §6.3).
 */
export function useNotes(status: NoteStatus): NotesSnapshot {
  const notes = useLiveQuery(
    () => (status === 'done' ? notesRepository.listDone() : notesRepository.listPending()),
    [status],
  );

  const counts = useLiveQuery(() => notesRepository.countByStatus(), []);

  return { notes, counts };
}
