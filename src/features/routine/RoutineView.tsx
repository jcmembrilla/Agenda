import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import {
  AlarmIcon,
  EditIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { weekdayIndex } from '../../lib/dates';
import { showToast } from '../../lib/toast';
import { routinesRepository } from './routines.repository';
import type { Routine } from './routines.types';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
/** Lunes a sábado ocupan la grilla: el domingo vive en la franja finita final. */
const GRID_WEEKDAY_COUNT = 6;

/** El permiso se pide recién cuando el usuario agrega una alarma; nunca en la carga. */
function requestAlarmPermission(): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  try {
    void Notification.requestPermission();
  } catch {
    // Pedir el permiso nunca bloquea el guardado de la hora.
  }
}

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
  const [hasAlarm, setHasAlarm] = useState(() => Boolean(routine?.time));
  const [time, setTime] = useState(() => routine?.time ?? '');
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
      const payload = { text, weekdays, time: hasAlarm ? time : undefined };
      if (routine) {
        await routinesRepository.update(routine.id, payload);
      } else {
        await routinesRepository.create(payload);
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
        <legend className="mb-2 text-xs font-semibold text-muted">Alarma (opcional)</legend>
        {hasAlarm ? (
          <div className="flex items-center gap-2">
            <input
              id="routine-alarm"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-control border border-border bg-canvas px-3 text-[16px] focus:border-accent/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setHasAlarm(false);
                setTime('');
              }}
              className="shrink-0 rounded-full text-xs font-medium text-muted transition-colors hover:text-danger"
            >
              Quitar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setHasAlarm(true);
              requestAlarmPermission();
            }}
            className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent transition-opacity hover:opacity-90"
          >
            <AlarmIcon className="size-3.5" />
            Agregar alarma
          </button>
        )}
      </fieldset>
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
}: {
  routine: Routine;
  /** Versión ampliada para la vista expandida del día: texto y horario más grandes. */
  expanded?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex min-w-0 items-center border-b border-border/60 last:border-0',
        expanded ? 'gap-2 py-2.5' : 'gap-1.5 py-1',
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
      {routine.time ? (
        <span
          className={cn(
            'flex shrink-0 items-center gap-0.5 rounded-full bg-accent-soft font-semibold text-accent',
            expanded ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0 text-[10px]',
          )}
        >
          <AlarmIcon className={expanded ? 'size-3.5' : 'size-3'} />
          {routine.time}
        </span>
      ) : null}
    </li>
  );
}

/** Tarjeta grande del panel de gestión: una sola, todo a lo ancho, con acciones visibles. */
function RoutineManageCard({
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
    <article
      aria-label={routine.text}
      className="rounded-block border border-border bg-surface p-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[16px] font-semibold leading-snug">{routine.text}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {routine.time ? (
              <span className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
                <AlarmIcon className="size-4" />
                {routine.time}
              </span>
            ) : null}
            {WEEKDAY_LABELS.map((label, weekday) => (
              <span
                key={label}
                className={cn(
                  'grid h-7 min-w-7 place-items-center rounded-full border px-1 text-[11px] font-semibold transition-colors',
                  routine.weekdays.includes(weekday)
                    ? 'border-accent bg-accent text-canvas'
                    : 'border-dashed border-border text-muted',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {confirming ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => {
                onRemove(routine.id);
              }}
              className="rounded-full px-3 py-1 text-[12px] font-semibold text-danger hover:bg-danger/10"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-3 py-1 text-[12px] font-medium text-muted"
            >
              No
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label={`${routine.time ? 'Editar' : 'Agregar'} alarma de ${routine.text}`}
              onClick={() => onEdit(routine)}
              className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <AlarmIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Editar rutina ${routine.text}`}
              onClick={() => onEdit(routine)}
              className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <EditIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`Eliminar rutina ${routine.text}`}
              onClick={() => setConfirming(true)}
              className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function RoutineView() {
  const [manageOpen, setManageOpen] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const routines = useLiveQuery(() => routinesRepository.list(), []);

  const openNewForm = () => {
    setEditingRoutine(null);
    setShowRoutineForm(true);
    setManageOpen(true);
  };

  const openEditForm = (routine: Routine) => {
    setEditingRoutine(routine);
    setShowRoutineForm(true);
  };

  const closeForm = () => {
    setEditingRoutine(null);
    setShowRoutineForm(false);
  };

  const toggleManager = () => {
    if (manageOpen) {
      closeForm();
      setManageOpen(false);
      return;
    }
    setManageOpen(true);
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
        key={editingRoutine?.id ?? 'new'}
        routine={editingRoutine ?? undefined}
        onSaved={closeForm}
      />
      <button type="button" onClick={closeForm} className="w-full py-2 text-xs font-medium text-muted">
        Cancelar
      </button>
    </div>
  );

  const sundayRoutines = (routines ?? []).filter((routine) => routine.weekdays.includes(6));

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
          aria-label={manageOpen ? 'Cerrar gestor de rutinas' : 'Abrir gestor de rutinas'}
          aria-expanded={manageOpen}
          onClick={toggleManager}
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full border transition-colors',
            manageOpen
              ? 'border-danger/50 bg-danger/10 text-danger hover:border-danger'
              : 'border-accent/40 bg-accent-soft text-accent hover:border-accent',
          )}
        >
            {manageOpen ? <MinusIcon className="size-5" /> : <PlusIcon className="size-5" />}
        </button>
      </div>

        {manageOpen ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
            <button
              type="button"
              onClick={openNewForm}
              className="mb-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
            >
              <PlusIcon className="size-4" />
              Nueva actividad
            </button>
            {showRoutineForm ? <div className="mb-3">{renderForm()}</div> : null}
            {routines && routines.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {routines.map((routine) => (
                <li key={routine.id}>
                  <RoutineManageCard
                    routine={routine}
                    onEdit={openEditForm}
                    onRemove={(id) => {
                      void removeRoutine(id);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-muted">
              No hay actividades cargadas. Creá la primera desde el botón Nueva actividad.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setManageOpen(false);
              setEditingRoutine(null);
            }}
            className="mt-2 w-full py-2 text-xs font-medium text-muted"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-1.5">
            {WEEKDAY_LONG.slice(0, GRID_WEEKDAY_COUNT).map((dayName, weekday) => {
              const dayRoutines = (routines ?? []).filter((routine) =>
                routine.weekdays.includes(weekday),
              );

              return (
                <article
                  key={dayName}
                  aria-label={dayName}
                  className="flex min-h-0 min-w-0 flex-col rounded-block border border-border bg-surface p-2 shadow-sm"
                >
                  <header className="shrink-0 px-0.5 text-center">
                    <h3 className="min-w-0 truncate">
                      <span className="text-[13px] font-semibold capitalize text-ink">{dayName}</span>
                    </h3>
                  </header>

                  <div className="scroll-fade mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {dayRoutines.length > 0 ? (
                      <ul className="flex flex-col">
                        {dayRoutines.map((routine) => (
                          <RoutineItem key={routine.id} routine={routine} />
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

          {/* Domingo: franja finita a todo el ancho para no ocupar una celda entera. */}
          <article
            aria-label="domingo"
            className="mt-1.5 w-full shrink-0 rounded-block border border-border bg-surface shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 px-3 py-1">
              <span className="text-[13px] font-semibold capitalize text-ink">
                domingo
              </span>
            </div>
            <div className="px-3 pb-2">
              {sundayRoutines.length > 0 ? (
                <ul className="flex flex-col">
                  {sundayRoutines.map((routine) => (
                    <RoutineItem key={routine.id} routine={routine} />
                  ))}
                </ul>
              ) : (
                <p className="py-1.5 text-[12px] leading-snug text-muted">Sin actividades.</p>
              )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
