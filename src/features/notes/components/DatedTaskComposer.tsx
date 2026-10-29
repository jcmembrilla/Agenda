import { useState } from 'react';
import { ArrowUpIcon } from '../../../components/ui/icons';
import { showToast } from '../../../lib/toast';
import type { NoteInput } from '../notes.types';

interface DatedTaskComposerProps {
  date: string;
  onCreate: (input: NoteInput) => Promise<unknown>;
  onCancel?: () => void;
}

export function DatedTaskComposer({ date, onCreate, onCancel }: DatedTaskComposerProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onCreate({ text, scheduledDate: date });
      setText('');
      onCancel?.();
    } catch {
      showToast({ message: 'No se pudo guardar la tarea para ese día.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void save(event)} className="flex items-center gap-2">
      <input
        value={text}
        maxLength={100}
        onChange={(event) => setText(event.target.value)}
        aria-label="Nueva tarea para este día"
        placeholder="¿Qué querés hacer?"
        className="h-10 min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 text-[16px] placeholder:text-muted/70 focus:border-accent/50 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Agregar tarea al día"
        disabled={!text.trim() || isSaving}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-canvas transition-opacity disabled:opacity-40"
      >
        <ArrowUpIcon className="size-4" />
      </button>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-2 text-xs font-medium text-muted"
        >
          Cancelar
        </button>
      ) : null}
    </form>
  );
}
