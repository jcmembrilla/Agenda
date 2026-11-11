import type { Table } from 'dexie';
import { db } from '../../lib/db';
import { createId } from '../../lib/id';
import type { EconomyEntry, EconomyEntryInput, EconomyFrequency } from './economy.types';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_AMOUNT = 1_000_000_000_000;

export class EconomyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EconomyValidationError';
  }
}

function normalizeInput(input: EconomyEntryInput): EconomyEntryInput {
  const label = input.label.trim();
  if (!MONTH_PATTERN.test(input.month)) {
    throw new EconomyValidationError('El mes seleccionado no es válido.');
  }
  if (!label) throw new EconomyValidationError('Escribí un nombre para el movimiento.');
  if (label.length > 100) {
    throw new EconomyValidationError('El nombre no puede superar los 100 caracteres.');
  }
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > MAX_AMOUNT) {
    throw new EconomyValidationError('Ingresá un importe válido mayor o igual a cero.');
  }
  if (!['monthly', 'quarterly', 'yearly'].includes(input.frequency)) {
    throw new EconomyValidationError('La frecuencia seleccionada no es válida.');
  }
  return { ...input, label, amount: Math.round(input.amount * 100) / 100 };
}

export function monthlyAmount(amount: number, frequency: EconomyFrequency): number {
  const monthly =
    frequency === 'yearly' ? amount / 12 : frequency === 'quarterly' ? amount / 3 : amount;
  return Math.round(monthly * 100) / 100;
}

export function createEconomyRepository(table: Table<EconomyEntry, string>) {
  return {
    list(month: string): Promise<EconomyEntry[]> {
      if (!MONTH_PATTERN.test(month)) {
        throw new EconomyValidationError('El mes seleccionado no es válido.');
      }
      return table.where('month').equals(month).sortBy('createdAt');
    },

    async create(input: EconomyEntryInput): Promise<EconomyEntry> {
      const normalized = normalizeInput(input);
      const now = Date.now();
      const entry: EconomyEntry = {
        ...normalized,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      };
      await table.add(entry);
      return entry;
    },

    async update(id: string, input: EconomyEntryInput): Promise<EconomyEntry> {
      const normalized = normalizeInput(input);
      return table.db.transaction('rw', table, async () => {
        const current = await table.get(id);
        if (!current) throw new EconomyValidationError('El movimiento ya no existe.');
        const updated = { ...current, ...normalized, updatedAt: Date.now() };
        await table.put(updated);
        return updated;
      });
    },

    async remove(id: string): Promise<void> {
      const entry = await table.get(id);
      if (!entry) throw new EconomyValidationError('El movimiento ya no existe.');
      await table.delete(id);
    },
  };
}

export type EconomyRepository = ReturnType<typeof createEconomyRepository>;
export const economyRepository = createEconomyRepository(db.economyEntries);
