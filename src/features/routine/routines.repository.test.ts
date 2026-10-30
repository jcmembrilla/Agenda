import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnotadorDB } from '../../lib/db';
import {
  createRoutinesRepository,
  normalizeWeekdays,
  RoutineValidationError,
  type RoutinesRepository,
} from './routines.repository';

let database: AnotadorDB;
let repository: RoutinesRepository;

beforeEach(async () => {
  database = new AnotadorDB(`routine-test-${crypto.randomUUID()}`);
  await database.open();
  repository = createRoutinesRepository(database.routines, database.routineOccurrences);
});

afterEach(async () => {
  database.close();
  await database.delete();
});

describe('routinesRepository', () => {
  it('crea rutinas semanales con días ordenados y sin duplicados', async () => {
    const routine = await repository.create({ text: '  Gimnasio ', weekdays: [4, 1, 4] });

    expect(routine.text).toBe('Gimnasio');
    expect(routine.weekdays).toEqual([1, 4]);
    expect(await repository.list()).toEqual([routine]);
  });

  it('rechaza días de semana inválidos o una rutina sin días', () => {
    expect(() => normalizeWeekdays([])).toThrow(RoutineValidationError);
    expect(() => normalizeWeekdays([7])).toThrow(RoutineValidationError);
  });

  it('actualiza el texto y los días de una rutina existente', async () => {
    const routine = await repository.create({ text: 'Leer', weekdays: [0] });

    const updated = await repository.update(routine.id, {
      text: 'Leer y escribir',
      weekdays: [1, 3],
    });

    expect(updated.text).toBe('Leer y escribir');
    expect(updated.weekdays).toEqual([1, 3]);
    expect(updated.createdAt).toBe(routine.createdAt);
    expect(updated.updatedAt).toBeGreaterThanOrEqual(routine.updatedAt);
    expect(await repository.list()).toEqual([updated]);
  });

  it('marca y desmarca una ocurrencia sin cambiar la rutina semanal', async () => {
    const routine = await repository.create({ text: 'Leer', weekdays: [0, 2] });

    await repository.toggleOccurrence(routine.id, '2028-05-01');
    expect(await repository.listOccurrences('2028-05-01', '2028-05-07')).toHaveLength(1);
    expect((await repository.list())[0]?.weekdays).toEqual([0, 2]);

    await repository.toggleOccurrence(routine.id, '2028-05-01');
    expect(await repository.listOccurrences('2028-05-01', '2028-05-07')).toHaveLength(0);
  });

  it('eliminar una rutina elimina también sus ocurrencias', async () => {
    const routine = await repository.create({ text: 'Caminar', weekdays: [0] });
    await repository.toggleOccurrence(routine.id, '2028-05-01');

    await repository.remove(routine.id);

    expect(await repository.list()).toHaveLength(0);
    expect(await repository.listOccurrences('2028-05-01', '2028-05-01')).toHaveLength(0);
  });
});
