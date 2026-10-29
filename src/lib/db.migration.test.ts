import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { AnotadorDB } from './db';

describe('AnotadorDB migration', () => {
  let legacyDatabase: Dexie | undefined;
  let migratedDatabase: AnotadorDB | undefined;

  afterEach(async () => {
    legacyDatabase?.close();
    migratedDatabase?.close();
    if (migratedDatabase) await migratedDatabase.delete();
    legacyDatabase = undefined;
    migratedDatabase = undefined;
  });

  it('preserves existing notes when upgrading from v1 to v2', async () => {
    const name = `migration-test-${crypto.randomUUID()}`;
    legacyDatabase = new Dexie(name);
    legacyDatabase.version(1).stores({
      notes: 'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt]',
    });
    await legacyDatabase.open();
    await legacyDatabase.table('notes').add({
      id: 'legacy-note',
      text: 'Nota anterior',
      status: 'pending',
      createdAt: 1,
      updatedAt: 1,
      completedAt: 0,
      deleted: 0,
    });
    legacyDatabase.close();

    migratedDatabase = new AnotadorDB(name);
    await migratedDatabase.open();

    expect(await migratedDatabase.notes.get('legacy-note')).toMatchObject({
      id: 'legacy-note',
      text: 'Nota anterior',
      status: 'pending',
    });
    expect(migratedDatabase.tables.map(({ name: tableName }) => tableName)).toEqual(
      expect.arrayContaining(['routines', 'routineOccurrences']),
    );
    expect(migratedDatabase.notes.schema.indexes.map(({ name: indexName }) => indexName)).toContain(
      '[deleted+scheduledDate+createdAt]',
    );
  });
});
