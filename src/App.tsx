import { useCallback, useEffect, useRef, useState } from 'react';
import { CompletionCelebration } from './components/ui/CompletionCelebration';
import { Toaster } from './components/ui/Toaster';
import { TrashIcon } from './components/ui/icons';
import { AlmanacView } from './features/almanac/AlmanacView';
import { AppHeader } from './features/notes/components/AppHeader';
import { MainTabs } from './features/notes/components/MainTabs';
import { NoteComposer } from './features/notes/components/NoteComposer';
import { TasksView } from './features/notes/components/TasksView';
import { useHashTab, type AppSection } from './features/notes/hooks/useHashTab';
import { useNoteMutations } from './features/notes/hooks/useNoteMutations';
import { useNotes } from './features/notes/hooks/useNotes';
import type { Note, NoteInput, NoteStatus } from './features/notes/notes.types';
import { RoutineView } from './features/routine/RoutineView';
import { prefersReducedMotion } from './lib/motion';
import { scrollToTop } from './lib/scroll';
import { showToast } from './lib/toast';
import { OfflineBanner } from './pwa/OfflineBanner';
import { UpdateBanner } from './pwa/UpdateBanner';

const ENTER_ANIMATION_MS = 400;
const HIGHLIGHT_MS = 900;
const COMPLETION_CELEBRATION_MS = 850;

export default function App() {
  const [section, setSection] = useHashTab();
  const [status, setStatus] = useState<NoteStatus>(() =>
    window.location.hash === '#realizadas' || window.location.hash === '#done' ? 'done' : 'pending',
  );
  const pendingSnapshot = useNotes('pending');
  const doneSnapshot = useNotes('done');
  const { create, updateText, complete, remove, removeAllDone, undoRemove, undoRemoveMany } =
    useNoteMutations();

  const [newId, setNewId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const pendingPanelRef = useRef<HTMLElement>(null);
  const handleCompletionStart = useCallback(() => {
    setShowCompletionCelebration(true);
  }, []);

  // Mantiene enlaces antiguos de Pendientes/Realizadas y los normaliza al nuevo tab Tareas.
  useEffect(() => {
    if (
      !window.location.hash ||
      window.location.hash === '#pendientes' ||
      window.location.hash === '#realizadas' ||
      window.location.hash === '#done'
    ) {
      window.history.replaceState(null, '', '#tareas');
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

  useEffect(() => {
    if (!showCompletionCelebration) return;
    const timer = window.setTimeout(() => {
      setShowCompletionCelebration(false);
    }, COMPLETION_CELEBRATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [showCompletionCelebration]);

  const handleCreate = async (input: NoteInput) => {
    const note = await create(input);

    setNewId(note.id);
    setStatus('pending');
    setSection('tasks');
    scrollToTop(pendingPanelRef.current, prefersReducedMotion() ? 'auto' : 'smooth');

    return note;
  };

  const handleCreateDated = (input: NoteInput) => create(input);

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

  const handleStatusChange = (nextStatus: NoteStatus) => {
    setConfirmingDeleteAll(false);
    setStatus(nextStatus);
  };

  const handleSectionChange = (nextSection: AppSection) => {
    setConfirmingDeleteAll(false);
    setSection(nextSection);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[560px] flex-col overflow-hidden bg-canvas">
      <AppHeader />

      <div className="shrink-0 px-4 pb-3">
        <MainTabs value={section} onChange={handleSectionChange} />
      </div>

      <main
        ref={pendingPanelRef}
        id="panel-tasks"
        role="tabpanel"
        aria-labelledby="tab-tasks"
        hidden={section !== 'tasks'}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <TasksView
          status={status}
          counts={pendingSnapshot.counts ?? doneSnapshot.counts}
          notes={status === 'pending' ? pendingSnapshot.notes : doneSnapshot.notes}
          newId={newId}
          highlightId={highlightId}
          onStatusChange={handleStatusChange}
          onCompletionStart={handleCompletionStart}
          onComplete={handleComplete}
          onUpdateText={updateText}
          onDelete={handleDelete}
        />

        {status === 'done' && doneSnapshot.notes && doneSnapshot.notes.length > 0 ? (
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
      </main>

      <main
        id="panel-routine"
        role="tabpanel"
        aria-labelledby="tab-routine"
        hidden={section !== 'routine'}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <RoutineView
          onCreateTask={handleCreateDated}
          onCompleteTask={handleComplete}
          onUpdateTask={updateText}
          onDeleteTask={handleDelete}
          onCompletionStart={handleCompletionStart}
        />
      </main>

      <main
        id="panel-almanac"
        role="tabpanel"
        aria-labelledby="tab-almanac"
        hidden={section !== 'almanac'}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
      >
        <AlmanacView
          onCreateTask={handleCreateDated}
          onCompleteTask={handleComplete}
          onUpdateTask={updateText}
          onDeleteTask={handleDelete}
          onCompletionStart={handleCompletionStart}
        />
      </main>

      <OfflineBanner />
      <UpdateBanner />
      {section === 'tasks' ? <NoteComposer onCreate={handleCreate} /> : null}

      <Toaster />
      {showCompletionCelebration ? <CompletionCelebration /> : null}
    </div>
  );
}
