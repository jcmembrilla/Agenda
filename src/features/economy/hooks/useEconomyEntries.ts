import { useLiveQuery } from 'dexie-react-hooks';
import { economyRepository } from '../economy.repository';

export function useEconomyEntries(month: string) {
  return useLiveQuery(() => economyRepository.list(month), [month]);
}
