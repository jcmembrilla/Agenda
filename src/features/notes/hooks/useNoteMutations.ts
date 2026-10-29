import { useMemo } from 'react';
import { notesRepository } from '../notes.repository';
import type { Note, NoteInput } from '../notes.types';

export interface NoteMutations {
  create: (input: NoteInput) => Promise<Note>;
  updateText: (id: string, text: string) => Promise<Note>;
  complete: (id: string) => Promise<Note>;
  remove: (id: string) => Promise<void>;
  undoRemove: (id: string) => Promise<void>;
}

/**
 * Frontera entre la UI y el repositorio. Es deliberadamente fina: existe para
 * que el Sprint 2 pueda encolar la sincronización acá sin tocar componentes.
 */
export function useNoteMutations(): NoteMutations {
  return useMemo<NoteMutations>(
    () => ({
      create: (input) => notesRepository.create(input),
      updateText: (id, text) => notesRepository.updateText(id, { text }),
      complete: (id) => notesRepository.complete(id),
      remove: (id) => notesRepository.softDelete(id),
      undoRemove: (id) => notesRepository.restore(id),
    }),
    [],
  );
}
