import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../../../components/ui/IconButton';
import { CheckSmallIcon, TrashIcon } from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import { showToast } from '../../../lib/toast';
import { useAutosize } from '../../../lib/useAutosize';
import { useCompleteAnimation } from '../hooks/useCompleteAnimation';
import { MAX_TEXT_LENGTH, type Note } from '../notes.types';
import { CheckButton } from './CheckButton';

export interface NoteBlockProps {
  note: Note;
  variant: 'pending' | 'done';
  isNew?: boolean;
  isHighlighted?: boolean;
  onComplete: (id: string) => Promise<unknown>;
  onUpdateText: (id: string, text: string) => Promise<unknown>;
  onDelete: (note: Note) => void;
}

export function NoteBlock({
  note,
  variant,
  isNew = false,
  isHighlighted = false,
  onComplete,
  onUpdateText,
  onDelete,
}: NoteBlockProps) {
  const { phase, containerRef, complete } = useCompleteAnimation<HTMLLIElement>(() =>
    onComplete(note.id),
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const cancelled = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutosize(textareaRef, draft, 120);

  useEffect(() => {
    if (!isEditing) return;

    const element = textareaRef.current;
    if (!element) return;

    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, [isEditing]);

  // El borrador se reinicia al entrar en edición: sin efectos que sincronicen
  // estado, no hay renders en cascada ni parpadeos.
  const startEditing = () => {
    setDraft(note.text);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    cancelled.current = true;
    setDraft(note.text);
    setIsEditing(false);
  };

  const commitEdit = () => {
    // El blur que sigue a un Escape no debe guardar.
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }

    const next = draft.trim();
    setIsEditing(false);

    if (next.length === 0 || next === note.text) {
      setDraft(note.text);
      return;
    }

    void onUpdateText(note.id, next).catch(() => {
      setDraft(note.text);
      showToast({ message: 'No se pudo guardar el cambio.' });
    });
  };

  const handleCheck = () => {
    void complete().catch(() => {
      showToast({ message: 'No se pudo completar la nota.' });
    });
  };

  const deleteLabel = `Eliminar nota: ${note.text.slice(0, 40)}`;

  if (variant === 'done') {
    return (
      <li className={cn(isHighlighted && 'animate-note-pulse')}>
        <article className="flex min-h-14 items-start gap-2.5 rounded-block border border-border bg-surface py-2 pl-3.5 pr-1">
          <span
            aria-hidden="true"
            className="mt-3 flex size-5 shrink-0 items-center justify-center text-success"
          >
            <CheckSmallIcon className="size-4" />
          </span>

          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => {
              setIsExpanded((value) => !value);
            }}
            className="min-h-10 flex-1 py-2.5 text-left"
          >
            <span
              className={cn(
                'note-text note-text--done text-[15px] whitespace-pre-wrap text-muted [overflow-wrap:anywhere]',
                'leading-[1.45]',
                !isExpanded && 'line-clamp-2',
              )}
            >
              {note.text}
            </span>
          </button>

          <IconButton
            label={deleteLabel}
            onClick={() => {
              onDelete(note);
            }}
            className="mt-0.5"
          >
            <TrashIcon className="size-5" />
          </IconButton>
        </article>
      </li>
    );
  }

  return (
    <li
      ref={containerRef}
      data-phase={phase}
      className={cn('note-collapse', isNew && 'animate-note-enter')}
    >
      <div className="min-h-0 overflow-hidden">
        <article className="flex min-h-14 items-start gap-2.5 rounded-block border border-border bg-surface py-2 pl-4 pr-1.5">
          {isEditing ? (
            <>
              <label htmlFor={`note-edit-${note.id}`} className="sr-only">
                Editar nota
              </label>
              <textarea
                id={`note-edit-${note.id}`}
                ref={textareaRef}
                value={draft}
                maxLength={MAX_TEXT_LENGTH}
                enterKeyHint="done"
                onChange={(event) => {
                  setDraft(event.target.value);
                }}
                onBlur={commitEdit}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelEdit();
                    return;
                  }

                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    commitEdit();
                  }
                }}
                className={cn(
                  'min-h-10 flex-1 resize-none bg-transparent py-2.5 text-[16px] leading-[1.45]',
                  '[overflow-wrap:anywhere] focus:outline-none',
                )}
              />

              <IconButton
                label={deleteLabel}
                onMouseDown={(event) => {
                  // Evita el blur del textarea antes del click: se elimina directo.
                  event.preventDefault();
                }}
                onClick={() => {
                  onDelete(note);
                }}
                className="mt-0.5"
              >
                <TrashIcon className="size-5" />
              </IconButton>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="min-h-10 flex-1 py-2.5 text-left"
              >
                <span
                  className={cn(
                    'note-text line-clamp-2 text-[15px] leading-[1.45]',
                    'whitespace-pre-wrap [overflow-wrap:anywhere]',
                  )}
                >
                  {note.text}
                </span>
              </button>

              <div className="mt-0.5">
                <CheckButton phase={phase} onPress={handleCheck} />
              </div>
            </>
          )}
        </article>
      </div>
    </li>
  );
}
