import { type Table } from 'dexie';
import { db } from '../../lib/db';
import { createId } from '../../lib/id';
import type { PersonalNote, PersonalNoteInput } from './personalNotes.types';

export class PersonalNoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersonalNoteValidationError';
  }
}

function normalizeText(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.trim()) {
    throw new PersonalNoteValidationError('La nota no puede estar vacía.');
  }
  return normalized;
}

export function createPersonalNotesRepository(table: Table<PersonalNote, string>) {
  return {
    async list(): Promise<PersonalNote[]> {
      return (await table.orderBy('updatedAt').reverse().toArray()).filter(
        (note) => note.deleted === 0,
      );
    },

    async create(input: PersonalNoteInput): Promise<PersonalNote> {
      const text = normalizeText(input.text);
      return table.db.transaction('rw', table, async () => {
        const existing = await table.toArray();
        const sequence = existing.reduce((max, note) => Math.max(max, note.sequence), 0) + 1;
        const now = Date.now();
        const note: PersonalNote = {
          id: createId(),
          sequence,
          title: `Nota ${sequence}`,
          text,
          createdAt: now,
          updatedAt: now,
          deleted: 0,
        };
        await table.add(note);
        return note;
      });
    },

    async update(id: string, text: string): Promise<PersonalNote> {
      const normalized = normalizeText(text);
      return table.db.transaction('rw', table, async () => {
        const note = await table.get(id);
        if (!note || note.deleted === 1) {
          throw new PersonalNoteValidationError('La nota ya no existe.');
        }
        if (note.text === normalized) return note;

        const updated = { ...note, text: normalized, updatedAt: Date.now() };
        await table.put(updated);
        return updated;
      });
    },

    async updateTitle(id: string, title: string): Promise<PersonalNote> {
      const normalized = title.trim();
      if (!normalized) {
        throw new PersonalNoteValidationError('El título no puede estar vacío.');
      }

      return table.db.transaction('rw', table, async () => {
        const note = await table.get(id);
        if (!note || note.deleted === 1) {
          throw new PersonalNoteValidationError('La nota ya no existe.');
        }
        if (note.title === normalized) return note;

        const updated = { ...note, title: normalized, updatedAt: Date.now() };
        await table.put(updated);
        return updated;
      });
    },

    async remove(id: string): Promise<PersonalNote> {
      return table.db.transaction('rw', table, async () => {
        const note = await table.get(id);
        if (!note || note.deleted === 1) {
          throw new PersonalNoteValidationError('La nota ya no existe.');
        }
        const deleted = { ...note, deleted: 1 as const, updatedAt: Date.now() };
        await table.put(deleted);
        return deleted;
      });
    },

    async restore(note: PersonalNote): Promise<void> {
      const current = await table.get(note.id);
      if (!current) throw new PersonalNoteValidationError('No se pudo recuperar la nota.');
      await table.put({ ...current, deleted: 0, updatedAt: Date.now() });
    },
  };
}

export type PersonalNotesRepository = ReturnType<typeof createPersonalNotesRepository>;

export const personalNotesRepository: PersonalNotesRepository = createPersonalNotesRepository(
  db.personalNotes,
);
