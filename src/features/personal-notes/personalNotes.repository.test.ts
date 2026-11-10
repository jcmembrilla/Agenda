import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnotadorDB } from '../../lib/db';
import {
  createPersonalNotesRepository,
  PersonalNoteValidationError,
  type PersonalNotesRepository,
} from './personalNotes.repository';

let database: AnotadorDB;
let repository: PersonalNotesRepository;

beforeEach(async () => {
  database = new AnotadorDB(`personal-notes-test-${crypto.randomUUID()}`);
  await database.open();
  repository = createPersonalNotesRepository(database.personalNotes);
});

afterEach(async () => {
  database.close();
  await database.delete();
});

describe('personalNotesRepository', () => {
  it('creates and lists notes with their full text', async () => {
    const note = await repository.create({ text: 'Primera línea\nSegunda línea' });

    expect(await repository.list()).toEqual([note]);
    expect(note.sequence).toBe(1);
    expect(note.title).toBe('Nota 1');
    expect(note.text).toBe('Primera línea\nSegunda línea');
  });

  it('keeps note numbering stable after renaming and deleting a note', async () => {
    const first = await repository.create({ text: 'Primera' });
    const second = await repository.create({ text: 'Segunda' });

    await repository.updateTitle(first.id, 'Ideas');
    await repository.remove(second.id);
    const third = await repository.create({ text: 'Tercera' });

    expect(third.sequence).toBe(3);
    expect(third.title).toBe('Nota 3');
    expect(await repository.list()).toHaveLength(2);
  });

  it('rejects an empty title', async () => {
    const note = await repository.create({ text: 'Con título' });

    await expect(repository.updateTitle(note.id, '  ')).rejects.toBeInstanceOf(
      PersonalNoteValidationError,
    );
  });

  it('updates note text and refreshes its modification time', async () => {
    const note = await repository.create({ text: 'Texto original' });
    const updated = await repository.update(note.id, 'Texto actualizado');

    expect(updated.text).toBe('Texto actualizado');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(note.updatedAt);
  });

  it('rejects blank notes and missing note updates', async () => {
    await expect(repository.create({ text: ' \n ' })).rejects.toBeInstanceOf(
      PersonalNoteValidationError,
    );
    await expect(repository.update('missing', 'Texto')).rejects.toBeInstanceOf(
      PersonalNoteValidationError,
    );
  });

  it('removes a note and restores it for an undo action', async () => {
    const note = await repository.create({ text: 'Nota recuperable' });

    const removed = await repository.remove(note.id);
    expect(await repository.list()).toEqual([]);

    await repository.restore(removed);
    expect(await repository.list()).toMatchObject([
      { id: note.id, sequence: note.sequence, title: note.title, text: note.text, deleted: 0 },
    ]);
  });
});
