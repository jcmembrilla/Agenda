export const ECONOMY_CATEGORIES = [
  'income-fixed',
  'income-extra',
  'expense-fixed',
  'expense-variable',
  'expense-periodic',
  'saving-emergency',
  'saving-goal',
  'saving-investment',
] as const;

export type EconomyCategory = (typeof ECONOMY_CATEGORIES)[number];
export type EconomyFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface EconomyEntry {
  id: string;
  month: string;
  category: EconomyCategory;
  label: string;
  amount: number;
  frequency: EconomyFrequency;
  createdAt: number;
  updatedAt: number;
}

export interface EconomyEntryInput {
  month: string;
  category: EconomyCategory;
  label: string;
  amount: number;
  frequency: EconomyFrequency;
}
