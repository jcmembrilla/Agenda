import { useRef, useState } from 'react';
import { ArrowUpIcon } from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import { showToast } from '../../../lib/toast';
import { useAutosize } from '../../../lib/useAutosize';
import { MAX_TEXT_LENGTH, type NoteInput } from '../notes.types';
import { NoteValidationError } from '../notes.repository';

interface NoteComposerProps {
  onCreate: (input: NoteInput) => Promise<unknown>;
}

const COUNTER_THRESHOLD = 80;

export function NoteComposer({ onCreate }: NoteComposerProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutosize(textareaRef, text, 96);

  const canSave = text.trim().length > 0 && !isSaving;
  const showCounter = text.length >= COUNTER_THRESHOLD;
  const isNearLimit = text.length >= MAX_TEXT_LENGTH - 5;

  const save = async () => {
    if (!canSave) return;

    setIsSaving(true);

    try {
      await onCreate({ text });
    } catch (error) {
      showToast({
        message:
          error instanceof NoteValidationError
            ? error.message
            : 'No se pudo guardar la nota. Probá de nuevo.',
      });
      return;
    } finally {
      setIsSaving(false);
    }

    // Solo se limpia si el guardado salió bien: el borrador nunca se pierde.
    setText('');
    // Mantiene el teclado abierto para anotar la siguiente sin volver a tocar.
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-[500px] shrink-0 self-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-1">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className={cn(
          'flex items-end gap-1.5 rounded-block border border-border bg-surface p-1.5 pl-2',
          'shadow-[0_-8px_24px_-18px_rgba(28,25,23,0.45)] transition-colors',
          'focus-within:border-accent/50',
        )}
      >
        <label htmlFor="note-composer" className="sr-only">
          Nueva nota
        </label>

        <textarea
          id="note-composer"
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={MAX_TEXT_LENGTH}
          enterKeyHint="done"
          placeholder="Anotá algo…"
          aria-describedby={showCounter ? 'composer-counter' : undefined}
          onChange={(event) => {
            setText(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void save();
            }
          }}
          className={cn(
            'min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2 text-[16px] leading-[22px]',
            'placeholder:text-muted/70 focus:outline-none',
          )}
        />

        <button
          type="submit"
          disabled={!canSave}
          aria-label="Guardar nota"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full bg-accent text-canvas',
            'transition-[transform,opacity] duration-150 active:scale-95',
            'disabled:opacity-30',
          )}
        >
          <ArrowUpIcon className="size-5" />
        </button>
      </form>

      <div className="flex min-h-4 items-center justify-between px-2 pt-1">
        <span className="hidden text-[11px] text-muted [@media(hover:hover)]:inline">
          {isSaving ? 'Guardando…' : 'Enter para guardar'}
        </span>
        {showCounter ? (
          <span
            id="composer-counter"
            aria-hidden="true"
            className={cn(
              'text-[11px] tabular-nums transition-colors',
              isNearLimit ? 'font-semibold text-accent' : 'text-muted',
            )}
          >
            {text.length}/{MAX_TEXT_LENGTH}
          </span>
        ) : null}
      </div>
    </div>
  );
}
