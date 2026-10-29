import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { CheckSmallIcon, TrashIcon } from '../../components/ui/icons';
import { DatedTaskComposer } from '../notes/components/DatedTaskComposer';
import { DatedNotes } from '../notes/components/DatedNotes';
import { notesRepository } from '../notes/notes.repository';
import type { Note, NoteInput } from '../notes/notes.types';
import { getWeekDates, toLocalISODate, weekdayIndex } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { routinesRepository } from './routines.repository';
import type { Routine } from './routines.types';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

interface RoutineViewProps {
  onCreateTask: (input: NoteInput) => Promise<unknown>;
  onCompleteTask: (id: string) => Promise<unknown>;
  onUpdateTask: (id: string, text: string) => Promise<unknown>;
  onDeleteTask: (note: Note) => void;
  onCompletionStart: () => void;
}

function RoutineForm({ onCreated }: { onCreated: () => void }) {
  const [text, setText] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([weekdayIndex(new Date())]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleWeekday = (weekday: number) => {
    setWeekdays((current) =>
      current.includes(weekday)
        ? current.filter((day) => day !== weekday)
        : [...current, weekday].sort((a, b) => a - b),
    );
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await routinesRepository.create({ text, weekdays });
      setText('');
      onCreated();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar la rutina.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="rounded-block border border-border bg-surface p-3 shadow-sm"
    >
      <label htmlFor="routine-text" className="mb-1.5 block text-xs font-semibold text-muted">
        Actividad que se repite
      </label>
      <input
        id="routine-text"
        value={text}
        maxLength={100}
        onChange={(event) => setText(event.target.value)}
        placeholder="Ej. Gimnasio"
        className="h-10 w-full rounded-control border border-border bg-canvas px-3 text-[16px] focus:border-accent/50 focus:outline-none"
      />
      <fieldset className="mt-3">
        <legend className="mb-2 text-xs font-semibold text-muted">Se repite estos días</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-pressed={weekdays.includes(index)}
              onClick={() => toggleWeekday(index)}
              className={cn(
                'grid size-9 place-items-center rounded-full border text-[11px] font-semibold transition-colors',
                weekdays.includes(index)
                  ? 'border-accent bg-accent text-canvas'
                  : 'border-border bg-canvas text-muted hover:border-accent/40',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={!text.trim() || weekdays.length === 0 || isSaving}
        className="mt-3 h-10 w-full rounded-full bg-accent text-sm font-semibold text-canvas transition-opacity disabled:opacity-40"
      >
        {isSaving ? 'Guardando…' : 'Guardar rutina'}
      </button>
    </form>
  );
}

function RoutineItem({
  routine,
  date,
  completed,
  onRemove,
}: {
  routine: Routine;
  date: string;
  completed: boolean;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex min-h-11 items-center gap-2 rounded-control border border-border/80 bg-canvas px-2">
      <button
        type="button"
        aria-label={`${completed ? 'Desmarcar' : 'Marcar'} ${routine.text} ${completed ? 'como pendiente' : 'como realizada'}`}
        aria-pressed={completed}
        onClick={() => {
          void routinesRepository.toggleOccurrence(routine.id, date).catch(() => {
            showToast({ message: 'No se pudo actualizar esta rutina.' });
          });
        }}
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full border transition-colors',
          completed
            ? 'border-success bg-success text-white'
            : 'border-border bg-surface text-transparent hover:border-accent',
        )}
      >
        <CheckSmallIcon className="size-4" />
      </button>
      <span className={cn('min-w-0 flex-1 text-[13px]', completed && 'text-muted')}>
        {routine.text}
      </span>
      {confirming ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onRemove(routine.id);
            }}
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-danger"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full px-2 py-1 text-[11px] text-muted"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Eliminar rutina ${routine.text}`}
          onClick={() => setConfirming(true)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
        >
          <TrashIcon className="size-4" />
        </button>
      )}
    </li>
  );
}

export function RoutineView({
  onCreateTask,
  onCompleteTask,
  onUpdateTask,
  onDeleteTask,
  onCompletionStart,
}: RoutineViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [addingTaskDate, setAddingTaskDate] = useState<string | null>(null);
  const weekDates = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekDates(base);
  }, [weekOffset]);
  const weekStart = toLocalISODate(weekDates[0] ?? new Date());
  const weekEnd = toLocalISODate(weekDates[6] ?? new Date());
  const routines = useLiveQuery(() => routinesRepository.list(), []);
  const occurrences = useLiveQuery(
    () => routinesRepository.listOccurrences(weekStart, weekEnd),
    [weekStart, weekEnd],
  );
  const datedNotes = useLiveQuery(
    () => notesRepository.listScheduledBetween(weekStart, weekEnd),
    [weekStart, weekEnd],
  );
  const completedOccurrences = useMemo(
    () => new Set((occurrences ?? []).map(({ id }) => id)),
    [occurrences],
  );

  const removeRoutine = async (id: string) => {
    try {
      await routinesRepository.remove(id);
    } catch {
      showToast({ message: 'No se pudo eliminar la rutina.' });
    }
  };

  const isCurrentWeek = weekOffset === 0;

  return (
    <section className="mx-auto w-full max-w-[500px]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold">Tu semana</h2>
          <p className="mt-0.5 text-xs text-muted">
            Hábitos que se repiten y planes para cada día.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => setWeekOffset((offset) => offset - 1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ‹
          </button>
          {!isCurrentWeek ? (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="rounded-full px-2 text-[11px] font-semibold text-accent"
            >
              Hoy
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Semana siguiente"
            onClick={() => setWeekOffset((offset) => offset + 1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-3">
        {showRoutineForm ? (
          <div className="space-y-2">
            <RoutineForm onCreated={() => setShowRoutineForm(false)} />
            <button
              type="button"
              onClick={() => setShowRoutineForm(false)}
              className="w-full py-2 text-xs font-medium text-muted"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRoutineForm(true)}
            className="w-full rounded-control border border-dashed border-accent/50 bg-accent-soft/50 px-3 py-2.5 text-left text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            + Agregar rutina semanal
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {weekDates.map((date) => {
          const dateISO = toLocalISODate(date);
          const weekday = weekdayIndex(date);
          const dayRoutines = (routines ?? []).filter((routine) =>
            routine.weekdays.includes(weekday),
          );
          const dayNotes = datedNotes?.filter((note) => note.scheduledDate === dateISO);
          const isToday = dateISO === toLocalISODate(new Date());

          return (
            <article
              key={dateISO}
              className={cn(
                'rounded-block border bg-surface p-3 shadow-sm',
                isToday ? 'border-accent/40' : 'border-border',
              )}
            >
              <header className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-[14px] font-semibold capitalize">
                  {WEEKDAY_LONG[weekday]} <span className="text-muted">{date.getDate()}</span>
                </h3>
                {isToday ? (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                    Hoy
                  </span>
                ) : null}
              </header>

              {dayRoutines.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {dayRoutines.map((routine) => (
                    <RoutineItem
                      key={routine.id}
                      routine={routine}
                      date={dateISO}
                      completed={completedOccurrences.has(`${routine.id}:${dateISO}`)}
                      onRemove={(id) => {
                        void removeRoutine(id);
                      }}
                    />
                  ))}
                </ul>
              ) : null}

              {dayNotes && dayNotes.length > 0 ? (
                <div
                  className={cn(dayRoutines.length > 0 && 'mt-2 border-t border-border/70 pt-2')}
                >
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Solo este día
                  </p>
                  <DatedNotes
                    notes={dayNotes}
                    onCompletionStart={onCompletionStart}
                    onComplete={onCompleteTask}
                    onUpdateText={onUpdateTask}
                    onDelete={onDeleteTask}
                  />
                </div>
              ) : null}

              {addingTaskDate === dateISO ? (
                <div className="mt-2">
                  <DatedTaskComposer
                    date={dateISO}
                    onCreate={onCreateTask}
                    onCancel={() => setAddingTaskDate(null)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingTaskDate(dateISO)}
                  className="mt-2 rounded-full px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent-soft"
                >
                  + Planear algo para este día
                </button>
              )}
            </article>
          );
        })}
      </div>
      {routines?.length === 0 ? (
        <p className="mt-3 text-center text-xs text-muted">
          Las rutinas que agregues aparecerán en los días elegidos.
        </p>
      ) : null}
    </section>
  );
}
