import { useEffect, useRef, useState } from 'react';
import { Toaster } from './components/ui/Toaster';
import { AppHeader } from './features/notes/components/AppHeader';
import { NoteComposer } from './features/notes/components/NoteComposer';
import { NoteList } from './features/notes/components/NoteList';
import { NotesTabs } from './features/notes/components/NotesTabs';
import { useHashTab } from './features/notes/hooks/useHashTab';
import { useNoteMutations } from './features/notes/hooks/useNoteMutations';
import { useNotes } from './features/notes/hooks/useNotes';
import type { Note, NoteInput } from './features/notes/notes.types';
import { prefersReducedMotion } from './lib/motion';
import { scrollToTop } from './lib/scroll';
import { showToast } from './lib/toast';
import { OfflineBanner } from './pwa/OfflineBanner';
import { UpdateBanner } from './pwa/UpdateBanner';

const ENTER_ANIMATION_MS = 400;
const HIGHLIGHT_MS = 900;

export default function App() {
  const [status, setStatus] = useHashTab();
  const { notes, counts } = useNotes(status);
  const { create, updateText, complete, remove, undoRemove } = useNoteMutations();

  const [newId, setNewId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  // La pestaña por defecto tiene hash propio: así el Atrás siempre tiene destino.
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#pendientes');
    }
  }, []);

  useEffect(() => {
    if (!newId) return;
    const timer = window.setTimeout(() => {
      setNewId(null);
    }, ENTER_ANIMATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [newId]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => {
      setHighlightId(null);
    }, HIGHLIGHT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [highlightId]);

  const handleCreate = async (input: NoteInput) => {
    const note = await create(input);

    setNewId(note.id);
    setStatus('pending');
    scrollToTop(mainRef.current, prefersReducedMotion() ? 'auto' : 'smooth');

    return note;
  };

  const handleComplete = async (id: string) => {
    await complete(id);
    setHighlightId(id);
  };

  const handleDelete = (note: Note) => {
    void remove(note.id)
      .then(() => {
        showToast({
          message: 'Nota eliminada',
          action: {
            label: 'Deshacer',
            onClick: () => {
              void undoRemove(note.id).catch(() => {
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
    <div className="mx-auto flex h-dvh w-full max-w-[560px] flex-col overflow-hidden bg-canvas">
      <AppHeader />

      <div className="shrink-0 px-4 pb-2.5">
        <NotesTabs value={status} counts={counts} onChange={setStatus} />
      </div>

      <main
        ref={mainRef}
        id={`panel-${status}`}
        role="tabpanel"
        aria-labelledby={`tab-${status}`}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <NoteList
          notes={notes}
          variant={status}
          newId={newId}
          highlightId={highlightId}
          onComplete={handleComplete}
          onUpdateText={updateText}
          onDelete={handleDelete}
        />
      </main>

      <OfflineBanner />
      <UpdateBanner />
      <NoteComposer onCreate={handleCreate} />

      <Toaster />
    </div>
  );
}
