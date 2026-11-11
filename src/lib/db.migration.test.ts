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

  it('preserves existing data when upgrading and creates the personal notes table', async () => {
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
      expect.arrayContaining([
        'personalNotes',
        'routines',
        'routineOccurrences',
        'eisenhowerTasks',
        'economyEntries',
      ]),
    );
    expect(migratedDatabase.notes.schema.indexes.map(({ name: indexName }) => indexName)).toContain(
      '[deleted+scheduledDate+createdAt]',
    );
  });

  it('adds numbered titles to personal notes when upgrading from v3', async () => {
    const name = `personal-notes-migration-${crypto.randomUUID()}`;
    legacyDatabase = new Dexie(name);
    legacyDatabase.version(3).stores({
      notes:
        'id, status, createdAt, [deleted+status+createdAt], [deleted+status+completedAt], [deleted+scheduledDate+createdAt]',
      personalNotes: 'id, createdAt, updatedAt',
      routines: 'id, createdAt, updatedAt',
      routineOccurrences: 'id, date, routineId, [date+routineId]',
    });
    await legacyDatabase.open();
    await legacyDatabase.table('personalNotes').bulkAdd([
      { id: 'later', text: 'Segunda', createdAt: 200, updatedAt: 200 },
      { id: 'earlier', text: 'Primera', createdAt: 100, updatedAt: 100 },
    ]);
    legacyDatabase.close();

    migratedDatabase = new AnotadorDB(name);
    await migratedDatabase.open();

    expect(await migratedDatabase.personalNotes.get('earlier')).toMatchObject({
      sequence: 1,
      title: 'Nota 1',
      deleted: 0,
    });
    expect(await migratedDatabase.personalNotes.get('later')).toMatchObject({
      sequence: 2,
      title: 'Nota 2',
      deleted: 0,
    });
  });
});
