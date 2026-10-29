import { NoteBlock } from './NoteBlock';
import type { Note } from '../notes.types';

interface DatedNotesProps {
  notes: Note[] | undefined;
  onCompletionStart: () => void;
  onComplete: (id: string) => Promise<unknown>;
  onUpdateText: (id: string, text: string) => Promise<unknown>;
  onDelete: (note: Note) => void;
}

export function DatedNotes({
  notes,
  onCompletionStart,
  onComplete,
  onUpdateText,
  onDelete,
}: DatedNotesProps) {
  if (notes === undefined) {
    return <p className="py-3 text-center text-xs text-muted">Cargando tareas…</p>;
  }

  if (notes.length === 0) {
    return <p className="py-3 text-center text-xs text-muted">Todavía no hay tareas para este día.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <NoteBlock
          key={note.id}
          note={note}
          variant={note.status}
          onCompletionStart={onCompletionStart}
          onComplete={onComplete}
          onUpdateText={onUpdateText}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
