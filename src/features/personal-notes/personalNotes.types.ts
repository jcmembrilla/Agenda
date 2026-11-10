export interface PersonalNote {
  id: string;
  sequence: number;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
  deleted: 0 | 1;
}

export interface PersonalNoteInput {
  text: string;
}
