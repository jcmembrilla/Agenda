export interface Routine {
  id: string;
  text: string;
  /** 0 = lunes, 6 = domingo. */
  weekdays: number[];
  /** Alarma opcional en formato `HH:mm` (ej. "15:00"). */
  time?: string;
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
