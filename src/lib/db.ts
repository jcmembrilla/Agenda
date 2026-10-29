import Dexie, { type Table } from 'dexie';
import type { Note } from '../features/notes/notes.types';

/**
 * Esquema v1.
 *
 * Los índices compuestos son la razón por la que `status` y `deleted` viven en el
 * registro en lugar de derivarse: IndexedDB no puede filtrar por dos claves
 * separadas en una sola pasada y no indexa `null`, así que `completedAt` usa `0`
 * como centinela (ver ADR-04 en architecture.md).
 */
export class AnotadorDB extends Dexie {
  notes!: Table<Note, string>;

  constructor(name = 'anotador') {
    super(name);
    this.version(1).stores({
      notes: 'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt]',
    });
  }
}

export const db = new AnotadorDB();
