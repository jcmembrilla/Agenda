import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnotadorDB } from '../../lib/db';
import {
  createEconomyRepository,
  EconomyValidationError,
  monthlyAmount,
  type EconomyRepository,
} from './economy.repository';

let database: AnotadorDB;
let repository: EconomyRepository;

beforeEach(async () => {
  database = new AnotadorDB(`economy-test-${crypto.randomUUID()}`);
  await database.open();
  repository = createEconomyRepository(database.economyEntries);
});

afterEach(async () => {
  database.close();
  await database.delete();
});

describe('economyRepository', () => {
  it('saves monthly budget entries and only lists the selected month', async () => {
    const salary = await repository.create({
      month: '2026-11',
      category: 'income-fixed',
      label: ' Sueldo ',
      amount: 1250000,
      frequency: 'monthly',
    });
    await repository.create({
      month: '2026-12',
      category: 'income-fixed',
      label: 'Sueldo',
      amount: 1300000,
      frequency: 'monthly',
    });

    expect(salary.label).toBe('Sueldo');
    expect(await repository.list('2026-11')).toEqual([salary]);
  });

  it('converts periodic bills to their monthly provision amount', () => {
    expect(monthlyAmount(120000, 'yearly')).toBe(10000);
    expect(monthlyAmount(30000, 'quarterly')).toBe(10000);
    expect(monthlyAmount(100, 'yearly')).toBe(8.33);
    expect(monthlyAmount(10000, 'monthly')).toBe(10000);
  });

  it('updates and removes a budget entry', async () => {
    const rent = await repository.create({
      month: '2026-11',
      category: 'expense-fixed',
      label: 'Alquiler',
      amount: 300000,
      frequency: 'monthly',
    });

    const updated = await repository.update(rent.id, {
      month: '2026-11',
      category: 'expense-fixed',
      label: 'Alquiler actualizado',
      amount: 350000,
      frequency: 'monthly',
    });

    expect(updated).toMatchObject({ label: 'Alquiler actualizado', amount: 350000 });
    await repository.remove(rent.id);
    expect(await repository.list('2026-11')).toEqual([]);
  });

  it('rejects invalid month, empty label, and negative amounts', async () => {
    await expect(
      repository.create({
        month: '2026-13',
        category: 'income-fixed',
        label: 'Sueldo',
        amount: 1,
        frequency: 'monthly',
      }),
    ).rejects.toThrow(EconomyValidationError);
    await expect(
      repository.create({
        month: '2026-11',
        category: 'income-fixed',
        label: ' ',
        amount: 1,
        frequency: 'monthly',
      }),
    ).rejects.toThrow(EconomyValidationError);
    await expect(
      repository.create({
        month: '2026-11',
        category: 'income-fixed',
        label: 'Sueldo',
        amount: -1,
        frequency: 'monthly',
      }),
    ).rejects.toThrow(EconomyValidationError);
  });
});
