import { EmptyState } from '../../../components/ui/EmptyState';
import { NoteSkeleton } from '../../../components/ui/NoteSkeleton';
import type { Note, NoteStatus } from '../notes.types';
import { NoteBlock, type NoteBlockProps } from './NoteBlock';

interface NoteListProps {
  notes: Note[] | undefined;
  variant: NoteStatus;
  newId: string | null;
  highlightId: string | null;
  onComplete: NoteBlockProps['onComplete'];
  onUpdateText: NoteBlockProps['onUpdateText'];
  onDelete: NoteBlockProps['onDelete'];
}

const EMPTY_COPY: Record<NoteStatus, { title: string; description: string }> = {
  pending: {
    title: 'Nada pendiente',
    description: 'Anotá abajo lo primero que tengas que hacer.',
  },
  done: {
    title: 'Todavía no completaste nada',
    description: 'Cuando taches una nota va a quedar acá, con su check.',
  },
};

export function NoteList({
  notes,
  variant,
  newId,
  highlightId,
  onComplete,
  onUpdateText,
  onDelete,
}: NoteListProps) {
  if (notes === undefined) {
    return <NoteSkeleton />;
  }

  if (notes.length === 0) {
    const copy = EMPTY_COPY[variant];
    return <EmptyState title={copy.title} description={copy.description} />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <NoteBlock
          key={note.id}
          note={note}
          variant={variant}
          isNew={note.id === newId}
          isHighlighted={note.id === highlightId}
          onComplete={onComplete}
          onUpdateText={onUpdateText}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
