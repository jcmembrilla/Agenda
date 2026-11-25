import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckSmallIcon,
  CloseIcon,
  GridIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { useEisenhowerTasks } from './hooks/useEisenhowerTasks';
import { eisenhowerRepository } from './eisenhower.repository';
import type { EisenhowerQuadrant, EisenhowerTask } from './eisenhower.types';

const QUADRANTS: ReadonlyArray<{
  id: EisenhowerQuadrant;
  title: string;
  example: string;
  color: string;
}> = [
  {
    id: 'do',
    title: 'Importante',
    example: 'Actividad concreta que tienes que hacer hoy',
    color: 'red',
  },
  {
    id: 'schedule',
    title: 'Importante, no urgente',
    example: 'Ej. estudiar o hacer ejercicio',
    color: 'orange',
  },
  {
    id: 'delegate',
    title: 'Urgente, no importante',
    example: 'Ej. responder correos rutinarios',
    color: 'yellow',
  },
  {
    id: 'eliminate',
    title: 'Ni urgente ni importante',
    example: 'Ej. revisar redes sin rumbo',
    color: 'white',
  },
];

/** El color vive solo en el título; el cuerpo de la tarjeta queda neutro. */
const TITLE_COLORS: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  orange: 'text-orange-600 dark:text-orange-400',
  yellow: 'text-yellow-700 dark:text-yellow-500',
  white: 'text-ink',
};

function tasksInQuadrant(tasks: EisenhowerTask[] | undefined, quadrant: EisenhowerQuadrant) {
  return tasks?.filter((task) => task.quadrant === quadrant) ?? [];
}

function TaskItem({
  task,
  onToggle,
  onRemove,
}: {
  task: EisenhowerTask;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <li className="flex items-start gap-2 border-b border-border/60 py-3 last:border-0">
      <button
        type="button"
        aria-label={task.completed ? `Reabrir ${task.text}` : `Completar ${task.text}`}
        onClick={() => onToggle(task.id)}
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
          task.completed ? 'border-success bg-success text-white' : 'border-border',
        )}
      >
        {task.completed ? <CheckSmallIcon className="size-4" /> : null}
      </button>
      <span
        className={cn(
          'min-w-0 flex-1 break-words text-[15px] leading-snug text-ink',
          task.completed && 'text-muted line-through',
        )}
      >
        {task.text}
      </span>
      <button
        type="button"
        aria-label={`Eliminar ${task.text}`}
        onClick={() => onRemove(task.id)}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <TrashIcon className="size-4" />
      </button>
    </li>
  );
}

export function EisenhowerView() {
  const tasks = useEisenhowerTasks();
  const [selectedQuadrant, setSelectedQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selected = QUADRANTS.find((quadrant) => quadrant.id === selectedQuadrant);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedQuadrant) return;
    setIsSaving(true);
    try {
      await eisenhowerRepository.create(text, selectedQuadrant);
      setText('');
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar la tarea.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await eisenhowerRepository.toggleCompleted(id);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo actualizar la tarea.',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await eisenhowerRepository.remove(id);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo eliminar la tarea.',
      });
    }
  };

  return (
    <section className="mx-auto flex h-full w-full max-w-[560px] flex-col">
      <div className="mb-3 flex shrink-0 items-center gap-2 px-1">
        <GridIcon className="size-4 shrink-0 text-accent" />
        <p className="text-[12px] leading-snug text-muted">
          Organizá tus tareas según su urgencia e importancia.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 snap-y snap-mandatory flex-col gap-3 overflow-y-auto overscroll-contain">
        {QUADRANTS.map((quadrant) => {
          const quadrantTasks = tasksInQuadrant(tasks, quadrant.id);

          return (
            <button
              key={quadrant.id}
              type="button"
              onClick={() => {
                setSelectedQuadrant(quadrant.id);
                setText('');
              }}
              aria-label={`Abrir ${quadrant.title}`}
              className="flex h-[calc(100%_-_3rem)] shrink-0 snap-start flex-col items-start rounded-block border border-border bg-surface p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
            >
              <span
                className={cn('text-[20px] font-bold leading-tight', TITLE_COLORS[quadrant.color])}
              >
                {quadrant.title}
              </span>

              <div className="mt-4 min-h-0 w-full flex-1 overflow-y-auto">
                {quadrantTasks.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {quadrantTasks.map((task) => (
                      <li
                        key={task.id}
                        className={cn(
                          'break-words text-[15px] leading-snug text-ink',
                          task.completed && 'text-muted line-through',
                        )}
                      >
                        {task.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[15px] leading-snug text-muted/70">{quadrant.example}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selected
        ? createPortal(
            <section
              aria-label={selected.title}
              className="fixed inset-0 z-50 flex flex-col bg-canvas pt-[env(safe-area-inset-top)]"
            >
              <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col border-x border-border/60 bg-canvas">
                <header className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-surface px-4 py-3">
                  <button
                    type="button"
                    aria-label="Volver a los cuatro cuadrantes"
                    onClick={() => setSelectedQuadrant(null)}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-ink transition-colors hover:bg-border/40"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                  <h2
                    className={cn(
                      'min-w-0 flex-1 text-[18px] font-bold leading-tight',
                      TITLE_COLORS[selected.color],
                    )}
                  >
                    {selected.title}
                  </h2>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <ul
                    aria-label={`Tareas: ${selected.title}`}
                    className="rounded-block border border-border/60 bg-surface px-3"
                  >
                    {tasksInQuadrant(tasks, selected.id).length > 0 ? (
                      tasksInQuadrant(tasks, selected.id).map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={(id) => void handleToggle(id)}
                          onRemove={(id) => void handleRemove(id)}
                        />
                      ))
                    ) : (
                      <li className="py-5 text-center text-[13px] leading-snug text-muted/70">
                        {selected.example}
                      </li>
                    )}
                  </ul>
                </div>
                <form
                  onSubmit={(event) => void handleCreate(event)}
                  className="mx-auto flex w-full max-w-[560px] shrink-0 items-center gap-2 border-t border-border/70 bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
                >
                  <input
                    aria-label={`Nueva tarea para ${selected.title}`}
                    value={text}
                    maxLength={200}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={selected.example}
                    className="h-11 min-w-0 flex-1 rounded-full border border-border bg-canvas px-4 text-[16px] text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Agregar tarea"
                    disabled={!text.trim() || isSaving}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-canvas transition-opacity disabled:opacity-40"
                  >
                    <PlusIcon className="size-5" />
                  </button>
                </form>
              </div>
            </section>,
            document.body,
          )
        : null}
    </section>
  );
}
