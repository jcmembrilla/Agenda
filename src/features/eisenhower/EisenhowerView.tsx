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
import {
  EISENHOWER_QUADRANTS,
  type EisenhowerQuadrant,
  type EisenhowerTask,
} from './eisenhower.types';

const QUADRANTS: ReadonlyArray<{
  id: EisenhowerQuadrant;
  title: string;
  action: string;
  guidance: string;
  example: string;
  color: string;
}> = [
  {
    id: 'do',
    title: 'Importante',
    action: 'Hacer durante estos dias',
    guidance: 'Plazos que vencen hoy.',
    example: 'Actividad concreta que tienes que hacer hoy',
    color: 'red',
  },
  {
    id: 'schedule',
    title: 'Importante, no urgente',
    action: 'Planificar y programar',
    guidance: 'Metas, salud y crecimiento a largo plazo.',
    example: 'Ej. estudiar o hacer ejercicio',
    color: 'orange',
  },
  {
    id: 'delegate',
    title: 'Urgente, no importante',
    action: 'Delegar',
    guidance: 'Interrupciones que no aportan a tus objetivos.',
    example: 'Ej. responder correos rutinarios',
    color: 'yellow',
  },
  {
    id: 'eliminate',
    title: 'Ni urgente ni importante',
    action: 'Eliminar o minimizar',
    guidance: 'Distracciones y tareas que no te aportan.',
    example: 'Ej. revisar redes sin rumbo',
    color: 'white',
  },
];

const COLOR_CLASSES: Record<string, string> = {
  red: 'border-red-300 bg-red-100 text-red-950 dark:border-red-900 dark:bg-red-950/70 dark:text-red-100',
  orange:
    'border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-900 dark:bg-orange-950/70 dark:text-orange-100',
  yellow:
    'border-yellow-300 bg-yellow-100 text-yellow-950 dark:border-yellow-900 dark:bg-yellow-950/70 dark:text-yellow-100',
  white: 'border-border bg-surface text-ink',
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
    <li className="flex items-start gap-2 border-b border-current/10 py-3 last:border-0">
      <button
        type="button"
        aria-label={task.completed ? `Reabrir ${task.text}` : `Completar ${task.text}`}
        onClick={() => onToggle(task.id)}
        className={cn(
          'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
          task.completed ? 'border-success bg-success text-white' : 'border-current/30',
        )}
      >
        {task.completed ? <CheckSmallIcon className="size-4" /> : null}
      </button>
      <span
        className={cn(
          'min-w-0 flex-1 break-words text-[15px] leading-snug',
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
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-3 flex items-center gap-2 px-1">
        <GridIcon className="size-4 shrink-0 text-accent" />
        <p className="text-[12px] leading-snug text-muted">
          Organizá tus tareas según su urgencia e importancia.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {EISENHOWER_QUADRANTS.map((quadrantId) => {
          const quadrant = QUADRANTS.find((item) => item.id === quadrantId);
          if (!quadrant) return null;
          const quadrantTasks = tasksInQuadrant(tasks, quadrantId);

          return (
            <button
              key={quadrant.id}
              type="button"
              onClick={() => {
                setSelectedQuadrant(quadrant.id);
                setText('');
              }}
              aria-label={`Abrir ${quadrant.title}`}
              className={cn(
                'flex min-h-[190px] flex-col items-start rounded-block border p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 active:scale-[0.99]',
                COLOR_CLASSES[quadrant.color],
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                {quadrant.action}
              </span>
              <span className="mt-1 text-[13px] font-bold leading-tight">{quadrant.title}</span>
              <span className="mt-1.5 text-[10px] leading-snug opacity-80">
                {quadrant.guidance}
              </span>
              <span className="mt-3 line-clamp-2 text-[10px] italic opacity-70">
                {quadrantTasks.length > 0
                  ? quadrantTasks
                      .filter((task) => !task.completed)
                      .slice(0, 2)
                      .map((task) => task.text)
                      .join(' · ') || 'Todas completadas'
                  : quadrant.example}
              </span>
              <span className="mt-auto pt-2 text-[10px] font-semibold">
                {quadrantTasks.length} {quadrantTasks.length === 1 ? 'tarea' : 'tareas'} · Abrir
              </span>
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
              <div
                className={cn(
                  'mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col border-x border-border/60',
                  COLOR_CLASSES[selected.color],
                )}
              >
                <header className="flex shrink-0 items-center gap-3 border-b border-current/15 px-4 py-3">
                  <button
                    type="button"
                    aria-label="Volver a los cuatro cuadrantes"
                    onClick={() => setSelectedQuadrant(null)}
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-surface/70 text-ink transition-colors hover:bg-surface"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                      {selected.action}
                    </p>
                    <h2 className="text-[18px] font-bold leading-tight">{selected.title}</h2>
                  </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <p className="mb-4 text-[13px] leading-relaxed opacity-80">
                    {selected.guidance} {selected.example}.
                  </p>
                  <ul
                    aria-label={`Tareas: ${selected.title}`}
                    className="rounded-block bg-surface/55 px-3"
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
                      <li className="py-5 text-center text-[13px] text-muted">
                        Aún no hay tareas aquí. {selected.example}.
                      </li>
                    )}
                  </ul>
                </div>
                <form
                  onSubmit={(event) => void handleCreate(event)}
                  className="mx-auto flex w-full max-w-[560px] shrink-0 items-center gap-2 border-t border-border/70 bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
                >
                  <input
                    aria-label={`Nueva tarea para ${selected.action}`}
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
    </div>
  );
}
