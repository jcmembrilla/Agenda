import { useEffect, useLayoutEffect, useRef } from 'react';
import { TrashIcon } from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import { showToast } from '../../../lib/toast';
import type { PersonalNote } from '../personalNotes.types';

interface PersonalNoteCardProps {
  note: PersonalNote;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, text: string) => Promise<unknown>;
  onUpdateTitle: (id: string, title: string) => Promise<unknown>;
  onDelete: (note: PersonalNote) => void;
}

export function PersonalNoteCard({
  note,
  selected,
  onSelect,
  onUpdate,
  onUpdateTitle,
  onDelete,
}: PersonalNoteCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textSaveTimer = useRef<number | null>(null);
  const titleSaveTimer = useRef<number | null>(null);
  const date = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(note.createdAt));

  useEffect(() => {
    if (!selected) return;
    const textarea = textareaRef.current;
    textarea?.focus();
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [note.id, selected]);

  useLayoutEffect(() => {
    if (!selected) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [note.id, selected]);

  const clearTimer = (timer: { current: number | null }) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const saveDraft = (text: string) => {
    clearTimer(textSaveTimer);
    if (text === note.text) return;
    void onUpdate(note.id, text).catch(() => {
      showToast({ message: 'No se pudo guardar el cambio.' });
    });
  };

  const saveTitle = (title: string) => {
    clearTimer(titleSaveTimer);
    if (!title.trim() || title.trim() === note.title) return;
    void onUpdateTitle(note.id, title).catch(() => {
      showToast({ message: 'No se pudo guardar el título.' });
    });
  };

  return (
    <article
      className={cn(
        'overflow-hidden rounded-block border border-border bg-surface shadow-sm',
        selected ? 'border-accent/50 ring-1 ring-accent/20' : 'max-h-[50dvh]',
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-medium text-muted">
          <input
            aria-label={`Título de la nota ${note.sequence}`}
            defaultValue={note.title}
            onChange={(event) => {
              const title = event.currentTarget.value;
              clearTimer(titleSaveTimer);
              titleSaveTimer.current = window.setTimeout(() => {
                titleSaveTimer.current = null;
                saveTitle(title);
              }, 400);
            }}
            onBlur={(event) => saveTitle(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="min-w-0 flex-1 bg-transparent font-semibold text-ink focus:outline-none"
          />
          <span aria-hidden="true">-</span>
          <time dateTime={new Date(note.createdAt).toISOString()} className="shrink-0">
            {date}
          </time>
        </div>
        <button
          type="button"
          aria-label={`Eliminar nota: ${note.title}`}
          onClick={() => onDelete(note)}
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      {selected ? (
        <textarea
          ref={textareaRef}
          aria-label="Editar nota"
          defaultValue={note.text}
          onChange={(event) => {
            const textarea = event.currentTarget;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
            clearTimer(textSaveTimer);
            const text = textarea.value;
            textSaveTimer.current = window.setTimeout(() => {
              textSaveTimer.current = null;
              saveDraft(text);
            }, 400);
          }}
          onBlur={(event) => saveDraft(event.currentTarget.value)}
          className="block min-h-24 w-full resize-none bg-transparent px-3 py-3 text-[15px] leading-relaxed text-ink focus:outline-none"
        />
      ) : (
        <button
          type="button"
          aria-label={`Abrir y editar nota: ${note.text.slice(0, 40)}`}
          onClick={onSelect}
          className="block w-full overflow-hidden px-3 py-3 text-left"
        >
          <span className="block whitespace-pre-wrap text-[15px] leading-relaxed text-ink [overflow-wrap:anywhere]">
            {note.text}
          </span>
        </button>
      )}
    </article>
  );
}
