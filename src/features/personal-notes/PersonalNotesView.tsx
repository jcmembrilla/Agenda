import { useState } from 'react';
import { ArrowUpIcon } from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { PersonalNoteCard } from './components/PersonalNoteCard';
import { usePersonalNotes } from './hooks/usePersonalNotes';
import {
  personalNotesRepository,
  PersonalNoteValidationError,
} from './personalNotes.repository';
import type { PersonalNote } from './personalNotes.types';

function updatePersonalNote(id: string, text: string): Promise<PersonalNote> {
  return personalNotesRepository.update(id, text);
}

function updatePersonalNoteTitle(id: string, title: string): Promise<PersonalNote> {
  return personalNotesRepository.updateTitle(id, title);
}

export function PersonalNotesView() {
  const notes = usePersonalNotes();
  const [draft, setDraft] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!draft.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const note = await personalNotesRepository.create({ text: draft });
      setDraft('');
      setSelectedId(note.id);
    } catch (error) {
      showToast({
        message:
          error instanceof PersonalNoteValidationError
            ? error.message
            : 'No se pudo guardar la nota. Probá de nuevo.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (note: PersonalNote) => {
    void personalNotesRepository
      .remove(note.id)
      .then((deletedNote) => {
        if (selectedId === note.id) setSelectedId(null);
        showToast({
          message: 'Nota eliminada',
          action: {
            label: 'Deshacer',
            onClick: () => {
              void personalNotesRepository.restore(deletedNote).catch(() => {
                showToast({ message: 'No se pudo recuperar la nota.' });
              });
            },
          },
          duration: 5000,
        });
      })
      .catch(() => {
        showToast({ message: 'No se pudo eliminar la nota.' });
      });
  };

  return (
    <section aria-labelledby="personal-notes-title" className="mx-auto max-w-[500px]">
      <header className="mb-4 pt-2">
        <h1 id="personal-notes-title" className="text-lg font-semibold tracking-tight">
          Notas
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Ideas y apuntes guardados en este dispositivo.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
        className="mb-4 rounded-block border border-border bg-surface p-2 shadow-sm focus-within:border-accent/50"
      >
        <label htmlFor="personal-note-composer" className="sr-only">
          Escribir una nota nueva
        </label>
        <textarea
          id="personal-note-composer"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribí una nota…"
          className="block max-h-[50dvh] min-h-20 w-full resize-y bg-transparent px-2 py-1.5 text-[15px] leading-relaxed placeholder:text-muted/70 focus:outline-none"
        />
        <div className="flex justify-end border-t border-border/60 pt-2">
          <button
            type="submit"
            disabled={!draft.trim() || isSaving}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[12px] font-semibold text-canvas',
              'transition-opacity disabled:opacity-40',
            )}
          >
            <ArrowUpIcon className="size-4" />
            {isSaving ? 'Guardando…' : 'Guardar nota'}
          </button>
        </div>
      </form>

      {notes === undefined ? (
        <p className="py-4 text-center text-sm text-muted">Cargando notas…</p>
      ) : notes.length === 0 ? (
        <p className="rounded-block border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          Todavía no hay notas. Escribí una arriba para empezar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id}>
              <PersonalNoteCard
                note={note}
                selected={selectedId === note.id}
                onSelect={() => setSelectedId(note.id)}
                onUpdate={updatePersonalNote}
                onUpdateTitle={updatePersonalNoteTitle}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
