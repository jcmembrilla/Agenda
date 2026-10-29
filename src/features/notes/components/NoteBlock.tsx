import { useEffect, useRef, useState, type PointerEvent } from 'react';
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
  onCompletionStart: () => void;
  onComplete: (id: string) => Promise<unknown>;
  onUpdateText: (id: string, text: string) => Promise<unknown>;
  onDelete: (note: Note) => void;
}

export function NoteBlock({
  note,
  variant,
  isNew = false,
  isHighlighted = false,
  onCompletionStart,
  onComplete,
  onUpdateText,
  onDelete,
}: NoteBlockProps) {
  const { phase, containerRef, complete } = useCompleteAnimation<HTMLLIElement>(
    () => onComplete(note.id),
    onCompletionStart,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const cancelled = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pointerStart = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

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

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (phase !== 'idle' || isEditing || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('button:not(.note-text-trigger)')) {
      return;
    }

    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    if (!start || start.id !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (!start.dragging && Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
      pointerStart.current = null;
      return;
    }

    if (deltaX < -8) {
      pointerStart.current = null;
      setDragOffset(0);
      return;
    }

    if (deltaX < 8) return;

    if (!start.dragging) {
      start.dragging = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    setDragOffset(Math.max(0, deltaX));
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    if (!start || start.id !== event.pointerId) return;

    pointerStart.current = null;
    if (!start.dragging) return;

    const deltaX = event.clientX - start.x;
    const threshold = Math.max(72, event.currentTarget.clientWidth * 0.28);
    setDragOffset(0);

    if (deltaX >= threshold) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      handleCheck();
      return;
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const handlePointerCancel = () => {
    pointerStart.current = null;
    setDragOffset(0);
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
                'text-[15px] leading-[1.45] whitespace-pre-wrap text-ink [overflow-wrap:anywhere]',
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
        <div className="relative overflow-hidden rounded-block bg-success">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-white"
          >
            <CheckSmallIcon className="size-6" />
          </span>
          <article
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onClickCapture={(event) => {
              if (!suppressClick.current) return;
              event.preventDefault();
              event.stopPropagation();
              suppressClick.current = false;
            }}
            style={
              dragOffset > 0 ? { transform: `translateX(${dragOffset}px)`, transition: 'none' } : {}
            }
            className={cn(
              'group relative flex min-h-14 items-start gap-2.5 rounded-block border border-border bg-surface py-2 pl-4 pr-1.5',
              'touch-pan-y select-none transition-transform duration-200 ease-out',
              dragOffset > 0 && 'shadow-md',
            )}
          >
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

                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
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
                  data-note-text-trigger
                  onClick={startEditing}
                  className="note-text-trigger min-h-10 flex-1 py-2.5 text-left"
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
      </div>
    </li>
  );
}
