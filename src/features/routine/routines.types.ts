export interface Routine {
  id: string;
  text: string;
  /** 0 = lunes, 6 = domingo. */
  weekdays: number[];
  createdAt: number;
  updatedAt: number;
}

export interface RoutineOccurrence {
  /** Determinista: `${routineId}:${date}` evita duplicados. */
  id: string;
  routineId: string;
  date: string;
  completedAt: number;
}
