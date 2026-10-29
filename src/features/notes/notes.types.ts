export const MAX_TEXT_LENGTH = 100;

export type NoteStatus = 'pending' | 'done';

/**
 * Un bloque del anotador.
 *
 * - `completedAt` usa `0` como "no completada": IndexedDB no indexa `null` y el
 *   registro desaparecería del índice compuesto.
 * - `deleted` es un tombstone: prepara la sincronización del Sprint 2 sin
 *   resucitar notas borradas.
 */
export interface Note {
  id: string;
  text: string;
  status: NoteStatus;
  createdAt: number;
  updatedAt: number;
  completedAt: number;
  deleted: 0 | 1;
  scheduledDate?: string;
}

export interface NoteInput {
  text: string;
  scheduledDate?: string;
}

export interface NotePatch {
  text: string;
  scheduledDate?: string;
}
