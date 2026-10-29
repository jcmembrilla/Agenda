import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnotadorDB } from '../../lib/db';
import {
  createNotesRepository,
  normalizeNoteText,
  NoteNotFoundError,
  NoteValidationError,
  type NotesRepository,
} from './notes.repository';
import { MAX_TEXT_LENGTH } from './notes.types';

let database: AnotadorDB;
let repository: NotesRepository;
let clock: number;

beforeEach(async () => {
  clock = 1_700_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => {
    clock += 1000;
    return clock;
  });

  database = new AnotadorDB(`anotador-test-${crypto.randomUUID()}`);
  await database.open();
  repository = createNotesRepository(database.notes);
});

afterEach(async () => {
  database.close();
  await database.delete();
});

describe('normalizeNoteText', () => {
  it('recorta espacios y normaliza saltos de línea', () => {
    expect(normalizeNoteText('  llamar al proveedor \r\n  ')).toBe('llamar al proveedor');
  });

  it('rechaza texto vacío o solo espacios', () => {
    expect(() => normalizeNoteText('   ')).toThrow(NoteValidationError);
  });

  it(`rechaza más de ${MAX_TEXT_LENGTH} caracteres`, () => {
    expect(() => normalizeNoteText('a'.repeat(MAX_TEXT_LENGTH + 1))).toThrow(NoteValidationError);
  });
});

describe('notesRepository', () => {
  it('crea una nota pendiente con centinela completedAt = 0', async () => {
    const note = await repository.create({ text: 'comprar café' });

    expect(note.status).toBe('pending');
    expect(note.completedAt).toBe(0);
    expect(note.deleted).toBe(0);
    expect(note.text).toBe('comprar café');
  });

  it('lista los pendientes con lo último anotado arriba', async () => {
    await repository.create({ text: 'primera' });
    await repository.create({ text: 'segunda' });

    const pending = await repository.listPending();

    expect(pending.map((note) => note.text)).toEqual(['segunda', 'primera']);
  });

  it('al completar, la nota sale de pendientes y entra primera en realizadas', async () => {
    const first = await repository.create({ text: 'primera' });
    const second = await repository.create({ text: 'segunda' });

    const completed = await repository.complete(first.id);

    expect(completed.status).toBe('done');
    expect(completed.completedAt).toBeGreaterThan(0);
    expect((await repository.listPending()).map((note) => note.id)).toEqual([second.id]);
    expect((await repository.listDone()).map((note) => note.id)).toEqual([first.id]);

    const newest = await repository.complete(second.id);
    const done = await repository.listDone();

    expect(done[0]?.id).toBe(newest.id);
  });

  it('completar dos veces es idempotente y no reescribe completedAt', async () => {
    const note = await repository.create({ text: 'una sola vez' });

    const first = await repository.complete(note.id);
    const second = await repository.complete(note.id);

    expect(second.completedAt).toBe(first.completedAt);
    expect(await repository.listDone()).toHaveLength(1);
  });

  it('el borrado es lógico y se puede deshacer', async () => {
    const note = await repository.create({ text: 'borrame' });

    await repository.softDelete(note.id);

    expect(await repository.listPending()).toHaveLength(0);

    await repository.restore(note.id);

    expect(await repository.listPending()).toHaveLength(1);
  });

  it('restaurar una nota que no existe falla de forma explícita', async () => {
    await expect(repository.restore('inexistente')).rejects.toBeInstanceOf(NoteNotFoundError);
  });

  it('actualiza el texto y rechaza dejarlo vacío', async () => {
    const note = await repository.create({ text: 'texto viejo' });

    const updated = await repository.updateText(note.id, { text: '  texto nuevo  ' });

    expect(updated.text).toBe('texto nuevo');
    expect(updated.updatedAt).toBeGreaterThan(note.updatedAt);

    await expect(repository.updateText(note.id, { text: '   ' })).rejects.toBeInstanceOf(
      NoteValidationError,
    );
  });

  it('cuenta pendientes y realizadas por separado', async () => {
    const first = await repository.create({ text: 'uno' });
    await repository.create({ text: 'dos' });
    await repository.create({ text: 'tres' });

    await repository.complete(first.id);

    expect(await repository.countByStatus()).toEqual({ pending: 2, done: 1 });
  });
});
