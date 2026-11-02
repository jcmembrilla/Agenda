import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { CloseIcon, EditIcon, PlusIcon, TrashIcon } from '../../components/ui/icons';
import { isoWeekNumber, weekdayIndex } from '../../lib/dates';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { routinesRepository } from './routines.repository';
import type { Routine } from './routines.types';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function RoutineForm({
  routine,
  initialWeekdays,
  onSaved,
}: {
  routine?: Routine;
  /** Días preseleccionados cuando se abre vacío (desde el botón de un día). */
  initialWeekdays?: number[];
  onSaved: () => void;
}) {
  const [text, setText] = useState(() => routine?.text ?? '');
  const [weekdays, setWeekdays] = useState<number[]>(
    () => routine?.weekdays ?? initialWeekdays ?? [weekdayIndex(new Date())],
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
        maxLength={200}
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
  expanded = false,
  onEdit,
  onRemove,
}: {
  routine: Routine;
  /** Versión ampliada para la vista expandida del día: texto y botones más grandes. */
  expanded?: boolean;
  onEdit: (routine: Routine) => void;
  onRemove: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li
      className={cn(
        'flex min-w-0 items-start border-b border-border/60 last:border-0',
        expanded ? 'gap-2 py-2.5' : 'gap-0.5 py-1',
      )}
    >
      <span
        className={cn(
          'min-w-0 flex-1 break-words text-left font-medium leading-snug',
          expanded ? 'text-[15px]' : 'text-[12px]',
        )}
      >
        {routine.text}
      </span>
      {confirming ? (
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              onRemove(routine.id);
            }}
            className={cn(
              'rounded-full font-semibold text-danger',
              expanded ? 'px-2.5 py-1 text-[12px]' : 'px-1.5 py-0.5 text-[10px]',
            )}
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className={cn(
              'rounded-full text-muted',
              expanded ? 'px-2.5 py-1 text-[12px]' : 'px-1.5 py-0.5 text-[10px]',
            )}
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
            className={cn(
              'grid shrink-0 place-items-center rounded-full text-muted hover:bg-accent-soft hover:text-accent',
              expanded ? 'size-7' : 'size-6',
            )}
          >
            <EditIcon className={expanded ? 'size-3.5' : 'size-3'} />
          </button>
          <button
            type="button"
            aria-label={`Eliminar rutina ${routine.text}`}
            onClick={() => setConfirming(true)}
            className={cn(
              'grid shrink-0 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger',
              expanded ? 'size-7' : 'size-6',
            )}
          >
            <TrashIcon className={expanded ? 'size-3.5' : 'size-3'} />
          </button>
        </div>
      )}
    </li>
  );
}

export function RoutineView() {
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  // Días que quedan preseleccionados al abrir el formulario sin rutina cargada.
  const [presetWeekdays, setPresetWeekdays] = useState<number[]>(() => [weekdayIndex(new Date())]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [weekNumber, setWeekNumber] = useState(() => isoWeekNumber(new Date()));
  const routines = useLiveQuery(() => routinesRepository.list(), []);

  // La app puede quedarse abierta varios días: al volver a verla se recalcula
  // la semana para que la celda inicial nunca quede desactualizada.
  useEffect(() => {
    const syncWeek = () => setWeekNumber(isoWeekNumber(new Date()));
    document.addEventListener('visibilitychange', syncWeek);
    window.addEventListener('focus', syncWeek);
    return () => {
      document.removeEventListener('visibilitychange', syncWeek);
      window.removeEventListener('focus', syncWeek);
    };
  }, []);

  // Escape cierra la vista expandida del día.
  useEffect(() => {
    if (expandedDay === null) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedDay(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [expandedDay]);

  const openNewForm = (weekdays: number[]) => {
    setEditingRoutine(null);
    setPresetWeekdays(weekdays);
    setShowRoutineForm(true);
  };

  const closeForm = () => {
    setEditingRoutine(null);
    setShowRoutineForm(false);
  };

  const removeRoutine = async (id: string) => {
    try {
      await routinesRepository.remove(id);
      if (editingRoutine?.id === id) {
        closeForm();
      }
    } catch {
      showToast({ message: 'No se pudo eliminar la rutina.' });
    }
  };

  const renderForm = () => (
    <div className="space-y-2">
      <RoutineForm
        key={editingRoutine?.id ?? `new-${presetWeekdays.join('-')}`}
        routine={editingRoutine ?? undefined}
        initialWeekdays={presetWeekdays}
        onSaved={closeForm}
      />
      <button type="button" onClick={closeForm} className="w-full py-2 text-xs font-medium text-muted">
        Cancelar
      </button>
    </div>
  );

  return (
    <section className="mx-auto flex h-full w-full max-w-[500px] flex-col">
      <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold">Rutina semanal</h2>
          <p className="mt-0.5 text-[10px] leading-tight text-muted">
            Actividades fijas para cada día.
          </p>
        </div>
        <button
          type="button"
          aria-label="Agregar rutina semanal"
          onClick={() => openNewForm([weekdayIndex(new Date())])}
          className="grid size-7 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent transition-colors hover:border-accent"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>

      {showRoutineForm && expandedDay === null ? (
        <div className="mb-2 shrink-0">{renderForm()}</div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-4 gap-1.5">
        <article
          key="semana"
          aria-label={`Semana ${weekNumber}`}
          className="grid min-h-0 min-w-0 place-content-center rounded-block border border-dashed border-accent/50 bg-accent-soft/60 p-1.5 text-center shadow-sm"
        >
          <p className="text-[11px] font-medium text-muted">Semana</p>
          <p className="text-[24px] font-semibold leading-tight text-accent">{weekNumber}</p>
        </article>

        {WEEKDAY_LONG.map((dayName, weekday) => {
          const dayRoutines = (routines ?? []).filter((routine) =>
            routine.weekdays.includes(weekday),
          );

          return (
            <article
              key={dayName}
              aria-label={dayName}
              className="relative flex min-h-0 min-w-0 flex-col rounded-block border border-border bg-surface p-2 shadow-sm"
            >
              <header className="shrink-0 px-0.5 text-center">
                <h3 className="min-w-0 truncate">
                  <button
                    type="button"
                    aria-label={`Expandir ${dayName}`}
                    onClick={() => setExpandedDay(weekday)}
                    className="w-full rounded-full text-[13px] font-semibold capitalize text-ink transition-colors hover:text-accent"
                  >
                    {dayName}
                  </button>
                </h3>
              </header>
              <button
                type="button"
                aria-label={`Agregar rutina el ${dayName}`}
                onClick={() => openNewForm([weekday])}
                className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full text-muted/60 transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <PlusIcon className="size-3" />
              </button>

              <div className="scroll-fade mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                  <p className="px-0.5 text-center text-[10px] leading-tight text-muted">
                    Sin actividades
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {expandedDay !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expanded-day-title"
          data-section="routine"
          className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-canvas"
        >
          <div className="mx-auto flex w-full max-w-[500px] flex-col px-5 pb-6 pt-[max(20px,env(safe-area-inset-top))]">
            <header className="mb-4 flex shrink-0 items-center justify-between gap-2">
              <h2 id="expanded-day-title" className="text-[22px] font-semibold capitalize">
                {WEEKDAY_LONG[expandedDay]}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Agregar rutina el ${WEEKDAY_LONG[expandedDay]}`}
                  onClick={() => openNewForm([expandedDay])}
                  className="grid size-9 place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent transition-colors hover:border-accent"
                >
                  <PlusIcon className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Cerrar vista del día"
                  onClick={() => setExpandedDay(null)}
                  className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-border/40 hover:text-ink"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
            </header>

            {showRoutineForm ? <div className="mb-4 shrink-0">{renderForm()}</div> : null}

            {(routines ?? []).filter((routine) => routine.weekdays.includes(expandedDay)).length >
            0 ? (
              <ul className="flex flex-col">
                {(routines ?? [])
                  .filter((routine) => routine.weekdays.includes(expandedDay))
                  .map((routine) => (
                    <RoutineItem
                      key={routine.id}
                      expanded
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
              <p className="mx-auto max-w-[360px] pt-8 text-center text-[13px] leading-relaxed text-muted">
                Sin actividades para este día. Tocá el botón + para agregar la primera.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
