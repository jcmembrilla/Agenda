import type { Table } from 'dexie';
import { db } from '../../lib/db';
import { createId } from '../../lib/id';
import type { EisenhowerQuadrant, EisenhowerTask } from './eisenhower.types';

export class EisenhowerTaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EisenhowerTaskValidationError';
  }
}

export function normalizeEisenhowerTaskText(text: string): string {
  const normalized = text.trim();
  if (!normalized) throw new EisenhowerTaskValidationError('La tarea no puede estar vacía.');
  if (normalized.length > 200) {
    throw new EisenhowerTaskValidationError('La tarea no puede superar los 200 caracteres.');
  }
  return normalized;
}

export function createEisenhowerRepository(table: Table<EisenhowerTask, string>) {
  return {
    list(): Promise<EisenhowerTask[]> {
      return table.orderBy('createdAt').reverse().toArray();
    },

    async create(text: string, quadrant: EisenhowerQuadrant): Promise<EisenhowerTask> {
      const normalized = normalizeEisenhowerTaskText(text);
      const now = Date.now();
      const task: EisenhowerTask = {
        id: createId(),
        text: normalized,
        quadrant,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      await table.add(task);
      return task;
    },

    async toggleCompleted(id: string): Promise<EisenhowerTask> {
      return table.db.transaction('rw', table, async () => {
        const current = await table.get(id);
        if (!current) throw new EisenhowerTaskValidationError('La tarea ya no existe.');
        const updated = { ...current, completed: !current.completed, updatedAt: Date.now() };
        await table.put(updated);
        return updated;
      });
    },

    async remove(id: string): Promise<void> {
      const existing = await table.get(id);
      if (!existing) throw new EisenhowerTaskValidationError('La tarea ya no existe.');
      await table.delete(id);
    },
  };
}

export type EisenhowerRepository = ReturnType<typeof createEisenhowerRepository>;
export const eisenhowerRepository = createEisenhowerRepository(db.eisenhowerTasks);
