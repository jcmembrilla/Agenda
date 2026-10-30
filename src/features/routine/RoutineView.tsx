import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { EditIcon, TrashIcon } from '../../components/ui/icons';
import { weekdayIndex } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { routinesRepository } from './routines.repository';
import type { Routine } from './routines.types';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function RoutineForm({
  routine,
  onSaved,
}: {
  routine?: Routine;
  onSaved: () => void;
}) {
  const [text, setText] = useState(() => routine?.text ?? '');
  const [weekdays, setWeekdays] = useState<number[]>(
    () => routine?.weekdays ?? [weekdayIndex(new Date())],
  );
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
      if (routine) {
        await routinesRepository.update(routine.id, { text, weekdays });
      } else {
        await routinesRepository.create({ text, weekdays });
      }
      onSaved();
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
        {routine ? 'Editar actividad' : 'Actividad que se repite'}
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
        {isSaving ? 'Guardando…' : routine ? 'Guardar cambios' : 'Guardar rutina'}
      </button>
    </form>
  );
}

function RoutineItem({
  routine,
  onEdit,
  onRemove,
}: {
  routine: Routine;
  onEdit: (routine: Routine) => void;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex min-w-0 items-start gap-1 border-b border-border/60 py-1.5 last:border-0">
      <span className="min-w-0 flex-1 break-words text-left text-[13px] font-medium leading-snug">
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
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={`Editar rutina ${routine.text}`}
            onClick={() => onEdit(routine)}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-accent-soft hover:text-accent"
          >
            <EditIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Eliminar rutina ${routine.text}`}
            onClick={() => setConfirming(true)}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
          >
            <TrashIcon className="size-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}

export function RoutineView() {
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const routines = useLiveQuery(() => routinesRepository.list(), []);

  const removeRoutine = async (id: string) => {
    try {
      await routinesRepository.remove(id);
      if (editingRoutine?.id === id) {
        setEditingRoutine(null);
        setShowRoutineForm(false);
      }
    } catch {
      showToast({ message: 'No se pudo eliminar la rutina.' });
    }
  };

  return (
    <section className="mx-auto w-full max-w-[500px]">
      <div className="mb-4">
        <div>
          <h2 className="text-[17px] font-semibold">Rutina semanal</h2>
          <p className="mt-0.5 text-xs text-muted">Actividades fijas para cada día.</p>
        </div>
      </div>

      <div className="mb-3">
        {showRoutineForm ? (
          <div className="space-y-2">
            <RoutineForm
              key={editingRoutine?.id ?? 'new'}
              routine={editingRoutine ?? undefined}
              onSaved={() => {
                setEditingRoutine(null);
                setShowRoutineForm(false);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setEditingRoutine(null);
                setShowRoutineForm(false);
              }}
              className="w-full py-2 text-xs font-medium text-muted"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditingRoutine(null);
              setShowRoutineForm(true);
            }}
            className="w-full rounded-control border border-dashed border-accent/50 bg-accent-soft/50 px-3 py-2.5 text-left text-[13px] font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            + Agregar rutina semanal
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 items-start gap-2">
        {WEEKDAY_LONG.map((dayName, weekday) => {
          const dayRoutines = (routines ?? []).filter((routine) =>
            routine.weekdays.includes(weekday),
          );
          const isSunday = weekday === 6;

          return (
            <article
              key={dayName}
              aria-label={dayName}
              className={cn(
                'min-w-0 rounded-block border bg-surface p-3 shadow-sm',
                isSunday && 'col-span-2 mx-auto w-[88%] max-w-[420px]',
                'border-border',
              )}
            >
              <header className="mb-2 text-center">
                <h3 className="text-[14px] font-semibold capitalize">{dayName}</h3>
              </header>

              {dayRoutines.length > 0 ? (
                <ul className="flex flex-col">
                  {dayRoutines.map((routine) => (
                    <RoutineItem
                      key={routine.id}
                      routine={routine}
                      onEdit={(routineToEdit) => {
                        setEditingRoutine(routineToEdit);
                        setShowRoutineForm(true);
                      }}
                      onRemove={(id) => {
                        void removeRoutine(id);
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-center text-[11px] text-muted">Sin actividades</p>
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
