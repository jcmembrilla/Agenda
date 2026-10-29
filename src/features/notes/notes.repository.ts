import { type Table } from 'dexie';
import { db } from '../../lib/db';
import { createId } from '../../lib/id';
import {
  MAX_TEXT_LENGTH,
  type Note,
  type NoteInput,
  type NotePatch,
  type NoteStatus,
} from './notes.types';

export class NoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteValidationError';
  }
}

export class NoteNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe la nota ${id}.`);
    this.name = 'NoteNotFoundError';
  }
}

export class NoteDateValidationError extends Error {
  constructor() {
    super('La fecha de la nota no es válida.');
    this.name = 'NoteDateValidationError';
  }
}

export interface NoteCounts {
  pending: number;
  done: number;
}

/** Cota superior de los índices por timestamp: mayor que cualquier `Date.now()`. */
const RANGE_END = Number.MAX_SAFE_INTEGER;

export function normalizeNoteText(raw: string): string {
  const text = raw.replace(/\r\n/g, '\n').trim();

  if (text.length === 0) {
    throw new NoteValidationError('La nota no puede estar vacía.');
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new NoteValidationError(`La nota no puede superar los ${MAX_TEXT_LENGTH} caracteres.`);
  }

  return text;
}

export function normalizeScheduledDate(date: string | undefined): string | undefined {
  if (date === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new NoteDateValidationError();

  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || year < 100) throw new NoteDateValidationError();
  const parsed = new Date(year, (month ?? 1) - 1, day ?? 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    throw new NoteDateValidationError();
  }

  return date;
}

function assertWritable(note: Note | undefined, id: string): Note {
  if (!note || note.deleted === 1) {
    throw new NoteNotFoundError(id);
  }

  return note;
}

/**
 * Única puerta de entrada a IndexedDB.
 *
 * Recibe la tabla por parámetro para poder testear contra una base aislada y
 * para que el Sprint 2 pueda envolver cada escritura en una transacción que
 * incluya la cola de sincronización sin tocar componentes.
 */
export function createNotesRepository(table: Table<Note, string>) {
  const countBy = (status: NoteStatus): Promise<number> =>
    table
      .where('[deleted+status+createdAt]')
      .between([0, status, 0], [0, status, RANGE_END], true, true)
      .count();

  return {
    /** Lo último anotado, arriba. Orden resuelto por el índice. */
    listPending(): Promise<Note[]> {
      return table
        .where('[deleted+status+createdAt]')
        .between([0, 'pending', 0], [0, 'pending', RANGE_END], true, true)
        .reverse()
        .toArray();
    },

    /** Lo último completado, arriba: la nota recién tachada entra primera. */
    listDone(): Promise<Note[]> {
      return table
        .where('[deleted+status+completedAt]')
        .between([0, 'done', 0], [0, 'done', RANGE_END], true, true)
        .reverse()
        .toArray();
    },

    listScheduledBetween(startDate: string, endDate: string): Promise<Note[]> {
      return table
        .where('[deleted+scheduledDate+createdAt]')
        .between([0, startDate, 0], [0, endDate, RANGE_END], true, true)
        .toArray();
    },

    async countByStatus(): Promise<NoteCounts> {
      const [pending, done] = await Promise.all([countBy('pending'), countBy('done')]);
      return { pending, done };
    },

    async create(input: NoteInput): Promise<Note> {
      const text = normalizeNoteText(input.text);
      const scheduledDate = normalizeScheduledDate(input.scheduledDate);
      const now = Date.now();
      const note: Note = {
        id: createId(),
        text,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        completedAt: 0,
        deleted: 0,
        ...(scheduledDate ? { scheduledDate } : {}),
      };

      await table.add(note);
      return note;
    },

    async updateText(id: string, patch: NotePatch): Promise<Note> {
      const text = normalizeNoteText(patch.text);

      return await table.db.transaction('rw', table, async () => {
        const current = assertWritable(await table.get(id), id);
        const scheduledDate =
          patch.scheduledDate === undefined
            ? current.scheduledDate
            : normalizeScheduledDate(patch.scheduledDate);

        if (current.text === text && current.scheduledDate === scheduledDate) {
          return current;
        }

        const next: Note = {
          ...current,
          text,
          updatedAt: Date.now(),
          ...(scheduledDate ? { scheduledDate } : {}),
        };
        if (scheduledDate === undefined) delete next.scheduledDate;
        await table.put(next);
        return next;
      });
    },

    complete(id: string): Promise<Note> {
      return table.db.transaction('rw', table, async () => {
        const current = assertWritable(await table.get(id), id);

        // Idempotente: doble commit (pestañas, reintentos) no reescribe la fecha.
        if (current.status === 'done') {
          return current;
        }

        const now = Date.now();
        const next: Note = {
          ...current,
          status: 'done',
          completedAt: now,
          updatedAt: now,
        };

        await table.put(next);
        return next;
      });
    },

    softDelete(id: string): Promise<void> {
      return table.db.transaction('rw', table, async () => {
        const current = assertWritable(await table.get(id), id);
        await table.put({ ...current, deleted: 1, updatedAt: Date.now() });
      });
    },

    softDeleteDone(): Promise<string[]> {
      return table.db.transaction('rw', table, async () => {
        const doneNotes = await table
          .where('[deleted+status+completedAt]')
          .between([0, 'done', 0], [0, 'done', RANGE_END], true, true)
          .toArray();
        const now = Date.now();

        await table.bulkPut(
          doneNotes.map((note) => ({ ...note, deleted: 1 as const, updatedAt: now })),
        );

        return doneNotes.map((note) => note.id);
      });
    },

    restoreMany(ids: string[]): Promise<void> {
      return table.db.transaction('rw', table, async () => {
        const notes = await table.bulkGet(ids);
        const now = Date.now();
        const notesToRestore = notes.filter((note): note is Note => note?.deleted === 1);

        await table.bulkPut(
          notesToRestore.map((note) => ({ ...note, deleted: 0 as const, updatedAt: now })),
        );
      });
    },

    restore(id: string): Promise<void> {
      return table.db.transaction('rw', table, async () => {
        const current = await table.get(id);

        if (!current) {
          throw new NoteNotFoundError(id);
        }

        if (current.deleted === 0) {
          return;
        }

        await table.put({ ...current, deleted: 0, updatedAt: Date.now() });
      });
    },
  };
}

export type NotesRepository = ReturnType<typeof createNotesRepository>;

export const notesRepository: NotesRepository = createNotesRepository(db.notes);
