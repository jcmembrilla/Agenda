import { type Table } from 'dexie';
import { db } from '../../lib/db';
import { createId } from '../../lib/id';
import { normalizeScheduledDate } from '../notes/notes.repository';
import type { Routine, RoutineOccurrence } from './routines.types';

export class RoutineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutineValidationError';
  }
}

export function normalizeRoutineText(text: string): string {
  const normalized = text.trim();
  if (!normalized) throw new RoutineValidationError('La rutina no puede estar vacía.');
  if (normalized.length > 100) {
    throw new RoutineValidationError('La rutina no puede superar los 100 caracteres.');
  }
  return normalized;
}

export function normalizeWeekdays(weekdays: number[]): number[] {
  const normalized = [...new Set(weekdays)].sort((a, b) => a - b);
  if (normalized.length === 0 || normalized.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new RoutineValidationError('Elegí al menos un día válido para la rutina.');
  }
  return normalized;
}

export function createRoutinesRepository(
  routines: Table<Routine, string>,
  occurrences: Table<RoutineOccurrence, string>,
) {
  return {
    list(): Promise<Routine[]> {
      return routines.orderBy('createdAt').toArray();
    },

    listOccurrences(startDate: string, endDate: string): Promise<RoutineOccurrence[]> {
      normalizeScheduledDate(startDate);
      normalizeScheduledDate(endDate);
      return occurrences.where('date').between(startDate, endDate, true, true).toArray();
    },

    async create(input: { text: string; weekdays: number[] }): Promise<Routine> {
      const text = normalizeRoutineText(input.text);
      const weekdays = normalizeWeekdays(input.weekdays);
      const now = Date.now();
      const routine: Routine = { id: createId(), text, weekdays, createdAt: now, updatedAt: now };
      await routines.add(routine);
      return routine;
    },

    async update(id: string, input: { text: string; weekdays: number[] }): Promise<Routine> {
      const text = normalizeRoutineText(input.text);
      const weekdays = normalizeWeekdays(input.weekdays);

      return routines.db.transaction('rw', routines, async () => {
        const routine = await routines.get(id);
        if (!routine) throw new RoutineValidationError('La rutina ya no existe.');

        const updated: Routine = { ...routine, text, weekdays, updatedAt: Date.now() };
        await routines.put(updated);
        return updated;
      });
    },

    toggleOccurrence(routineId: string, date: string): Promise<void> {
      normalizeScheduledDate(date);
      const occurrenceId = `${routineId}:${date}`;

      return routines.db.transaction('rw', routines, occurrences, async () => {
        const routine = await routines.get(routineId);
        if (!routine) throw new RoutineValidationError('La rutina ya no existe.');

        const current = await occurrences.get(occurrenceId);
        if (current) {
          await occurrences.delete(occurrenceId);
          return;
        }

        await occurrences.add({
          id: occurrenceId,
          routineId,
          date,
          completedAt: Date.now(),
        });
      });
    },

    remove(id: string): Promise<void> {
      return routines.db.transaction('rw', routines, occurrences, async () => {
        await occurrences.where('routineId').equals(id).delete();
        await routines.delete(id);
      });
    },
  };
}

export type RoutinesRepository = ReturnType<typeof createRoutinesRepository>;
export const routinesRepository = createRoutinesRepository(db.routines, db.routineOccurrences);
