import { useEffect, useRef, useState } from 'react';
import { Toaster } from './components/ui/Toaster';
import { TrashIcon } from './components/ui/icons';
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
  const pendingSnapshot = useNotes('pending');
  const doneSnapshot = useNotes('done');
  const { create, updateText, complete, remove, removeAllDone, undoRemove, undoRemoveMany } =
    useNoteMutations();

  const [newId, setNewId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const pendingPanelRef = useRef<HTMLElement>(null);

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
    scrollToTop(pendingPanelRef.current, prefersReducedMotion() ? 'auto' : 'smooth');

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

  const handleDeleteAllDone = async () => {
    setIsDeletingAll(true);

    try {
      const deletedIds = await removeAllDone();
      setConfirmingDeleteAll(false);

      if (deletedIds.length === 0) return;

      showToast({
        message: `${deletedIds.length} ${deletedIds.length === 1 ? 'nota eliminada' : 'notas eliminadas'}`,
        action: {
          label: 'Deshacer',
          onClick: () => {
            void undoRemoveMany(deletedIds).catch(() => {
              showToast({ message: 'No se pudieron recuperar las notas.' });
            });
          },
        },
        duration: 5000,
      });
    } catch {
      showToast({ message: 'No se pudieron eliminar las notas realizadas.' });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleStatusChange = (nextStatus: 'pending' | 'done') => {
    setConfirmingDeleteAll(false);
    setStatus(nextStatus);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[560px] flex-col overflow-hidden bg-canvas">
      <AppHeader />

      <div className="shrink-0 px-4 pb-3">
        <NotesTabs
          value={status}
          counts={pendingSnapshot.counts ?? doneSnapshot.counts}
          onChange={handleStatusChange}
        />
      </div>

      <main
        ref={pendingPanelRef}
        id="panel-pending"
        role="tabpanel"
        aria-labelledby="tab-pending"
        hidden={status !== 'pending'}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <div className="mx-auto w-full max-w-[500px]">
          <NoteList
            notes={pendingSnapshot.notes}
            variant="pending"
            newId={newId}
            highlightId={highlightId}
            onComplete={handleComplete}
            onUpdateText={updateText}
            onDelete={handleDelete}
          />
        </div>
      </main>

      <main
        id="panel-done"
        role="tabpanel"
        aria-labelledby="tab-done"
        hidden={status !== 'done'}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <div className="mx-auto w-full max-w-[500px]">
          <NoteList
            notes={doneSnapshot.notes}
            variant="done"
            newId={newId}
            highlightId={highlightId}
            onComplete={handleComplete}
            onUpdateText={updateText}
            onDelete={handleDelete}
          />

          {doneSnapshot.notes && doneSnapshot.notes.length > 0 ? (
            <div className="mt-4 border-t border-border/70 pt-3">
              {confirmingDeleteAll ? (
                <div
                  role="group"
                  aria-labelledby="delete-all-title"
                  className="rounded-control border border-border bg-surface p-3 shadow-sm"
                >
                  <p id="delete-all-title" className="text-center text-[13px] font-medium">
                    ¿Borrar todas las notas realizadas?
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDeleteAll(false);
                      }}
                      disabled={isDeletingAll}
                      className="h-9 rounded-full px-4 text-[12px] font-medium text-muted transition-colors hover:bg-border/40"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteAllDone();
                      }}
                      disabled={isDeletingAll}
                      className="h-9 rounded-full bg-danger px-4 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {isDeletingAll ? 'Borrando…' : 'Sí, borrar todas'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDeleteAll(true);
                  }}
                  className="mx-auto flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:text-danger"
                >
                  <TrashIcon className="size-4" />
                  Borrar todas las realizadas
                </button>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <OfflineBanner />
      <UpdateBanner />
      <NoteComposer onCreate={handleCreate} />

      <Toaster />
    </div>
  );
}
