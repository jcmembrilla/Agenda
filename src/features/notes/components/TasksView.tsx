import { NoteList } from './NoteList';
import { NotesTabs } from './NotesTabs';
import type { NoteCounts } from '../notes.repository';
import type { Note, NoteStatus } from '../notes.types';

interface TasksViewProps {
  status: NoteStatus;
  counts: NoteCounts | undefined;
  notes: Note[] | undefined;
  newId: string | null;
  highlightId: string | null;
  onStatusChange: (status: NoteStatus) => void;
  onCompletionStart: () => void;
  onComplete: (id: string) => Promise<unknown>;
  onUpdateText: (id: string, text: string) => Promise<unknown>;
  onDelete: (note: Note) => void;
}

export function TasksView({
  status,
  counts,
  notes,
  newId,
  highlightId,
  onStatusChange,
  onCompletionStart,
  onComplete,
  onUpdateText,
  onDelete,
}: TasksViewProps) {
  return (
    <div className="mx-auto w-full max-w-[500px]">
      <div className="mb-4 flex justify-center">
        <NotesTabs value={status} counts={counts} onChange={onStatusChange} />
      </div>
      {(['pending', 'done'] as const).map((tabStatus) => (
        <section
          key={tabStatus}
          id={`panel-${tabStatus}`}
          role="tabpanel"
          aria-labelledby={`tab-${tabStatus}`}
          hidden={status !== tabStatus}
        >
          {status === tabStatus ? (
            <NoteList
              notes={notes}
              variant={tabStatus}
              newId={newId}
              highlightId={highlightId}
              onCompletionStart={onCompletionStart}
              onComplete={onComplete}
              onUpdateText={onUpdateText}
              onDelete={onDelete}
            />
          ) : null}
        </section>
      ))}
    </div>
  );
}
