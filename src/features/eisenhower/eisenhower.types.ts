export const EISENHOWER_QUADRANTS = ['do', 'schedule', 'delegate', 'eliminate'] as const;

export type EisenhowerQuadrant = (typeof EISENHOWER_QUADRANTS)[number];

export interface EisenhowerTask {
  id: string;
  text: string;
  quadrant: EisenhowerQuadrant;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}
