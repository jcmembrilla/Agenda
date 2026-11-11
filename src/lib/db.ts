import Dexie, { type Table } from 'dexie';
import type { PersonalNote } from '../features/personal-notes/personalNotes.types';
import type { Note } from '../features/notes/notes.types';
import type { Routine, RoutineOccurrence } from '../features/routine/routines.types';
import type { EisenhowerTask } from '../features/eisenhower/eisenhower.types';
import type { EconomyEntry } from '../features/economy/economy.types';

/**
 * Esquema v2.
 *
 * Los índices compuestos son la razón por la que `status` y `deleted` viven en el
 * registro en lugar de derivarse: IndexedDB no puede filtrar por dos claves
 * separadas en una sola pasada y no indexa `null`, así que `completedAt` usa `0`
 * como centinela (ver ADR-04 en architecture.md).
 */
export class AnotadorDB extends Dexie {
  notes!: Table<Note, string>;
  personalNotes!: Table<PersonalNote, string>;
  routines!: Table<Routine, string>;
  routineOccurrences!: Table<RoutineOccurrence, string>;
  eisenhowerTasks!: Table<EisenhowerTask, string>;
  economyEntries!: Table<EconomyEntry, string>;

  constructor(name = 'anotador') {
    super(name);
    this.version(1).stores({
      notes: 'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt]',
    });
    this.version(2).stores({
      notes:
        'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
      routines: 'id, createdAt, updatedAt',
      routineOccurrences: 'id, date, routineId, [date+routineId]',
    });
    this.version(3).stores({
      notes:
        'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
      personalNotes: 'id, createdAt, updatedAt',
      routines: 'id, createdAt, updatedAt',
      routineOccurrences: 'id, date, routineId, [date+routineId]',
    });
    this.version(4)
      .stores({
        notes:
          'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
        personalNotes: 'id, createdAt, updatedAt, deleted',
        routines: 'id, createdAt, updatedAt',
        routineOccurrences: 'id, date, routineId, [date+routineId]',
      })
      .upgrade(async (transaction) => {
        const table = transaction.table<PersonalNote, string>('personalNotes');
        const notes = await table.toArray();
        notes.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
        await table.bulkPut(
          notes.map((note, index) => ({
            ...note,
            sequence: note.sequence ?? index + 1,
            title: note.title ?? `Nota ${index + 1}`,
            deleted: note.deleted ?? 0,
          })),
        );
      });
    this.version(5).stores({
      notes:
        'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
      personalNotes: 'id, createdAt, updatedAt, deleted',
      routines: 'id, createdAt, updatedAt',
      routineOccurrences: 'id, date, routineId, [date+routineId]',
      eisenhowerTasks: 'id, quadrant, createdAt',
    });
    this.version(6).stores({
      notes:
        'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
      personalNotes: 'id, createdAt, updatedAt, deleted',
      routines: 'id, createdAt, updatedAt',
      routineOccurrences: 'id, date, routineId, [date+routineId]',
      eisenhowerTasks: 'id, quadrant, createdAt',
      economyEntries: 'id, month, category, [month+category]',
    });
  }
}

export const db = new AnotadorDB();
