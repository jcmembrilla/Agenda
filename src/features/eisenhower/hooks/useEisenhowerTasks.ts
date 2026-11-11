import { useLiveQuery } from 'dexie-react-hooks';
import { eisenhowerRepository } from '../eisenhower.repository';

export function useEisenhowerTasks() {
  return useLiveQuery(() => eisenhowerRepository.list(), []);
}
