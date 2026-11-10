import { useLiveQuery } from 'dexie-react-hooks';
import { personalNotesRepository } from '../personalNotes.repository';

export function usePersonalNotes() {
  return useLiveQuery(() => personalNotesRepository.list(), []);
}
