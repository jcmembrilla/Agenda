import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { DatedTaskComposer } from '../notes/components/DatedTaskComposer';
import { DatedNotes } from '../notes/components/DatedNotes';
import { notesRepository } from '../notes/notes.repository';
import type { Note, NoteInput } from '../notes/notes.types';
import { formatLongDate, toLocalISODate } from '../../lib/dates';
import { cn } from '../../lib/cn';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('es-AR', { month: 'long' });

interface AlmanacViewProps {
  onCreateTask: (input: NoteInput) => Promise<unknown>;
  onCompleteTask: (id: string) => Promise<unknown>;
  onUpdateTask: (id: string, text: string) => Promise<unknown>;
  onDeleteTask: (note: Note) => void;
  onCompletionStart: () => void;
}

function MonthCalendar({
  year,
  month,
  selectedDate,
  datesWithNotes,
  onSelect,
  compact = true,
}: {
  year: number;
  month: number;
  selectedDate: string;
  datesWithNotes: Set<string>;
  onSelect: (date: string) => void;
  /** true = celdas mínimas (vista anual); false = tamaño cómodo (vista mensual). */
  compact?: boolean;
  }) {
  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = MONTH_FORMATTER.format(firstDay);

  return (
    <section
      aria-label={`${monthLabel} ${year}`}
      className={cn('rounded-control border border-border bg-surface p-2.5', !compact && 'p-3')}
    >
      <h3
        className={cn(
          'mb-2 text-center font-semibold capitalize',
          compact ? 'text-xs' : 'text-[15px]',
        )}
      >
        {monthLabel}
      </h3>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden="true"
            className={cn(
              'mx-auto grid aspect-square w-full place-items-center font-medium text-muted',
              compact ? 'max-w-7 text-[9px]' : 'max-w-11 text-[11px]',
            )}
          >
            {label}
          </span>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => (
          <span
            key={`empty-${index}`}
            aria-hidden="true"
            className={cn('mx-auto aspect-square w-full', compact ? 'max-w-7' : 'max-w-11')}
          />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, month, index + 1);
          const dateISO = toLocalISODate(date);
          const isSelected = selectedDate === dateISO;
          const isToday = toLocalISODate(new Date()) === dateISO;
          const hasNotes = datesWithNotes.has(dateISO);

          return (
            <button
              key={dateISO}
              type="button"
              aria-label={`${formatLongDate(date)}${hasNotes ? ', tiene tareas' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(dateISO)}
              className={cn(
                'relative mx-auto grid aspect-square w-full place-items-center rounded-full transition-colors',
                compact ? 'max-w-7 text-[10px]' : 'max-w-11 text-[15px] font-medium',
                isSelected
                  ? 'bg-accent text-canvas'
                  : isToday
                    ? 'font-bold text-accent ring-1 ring-accent/50'
                    : 'text-ink hover:bg-accent-soft',
              )}
            >
              {index + 1}
              {hasNotes ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute bottom-0.5 size-1 rounded-full',
                    isSelected ? 'bg-canvas' : 'bg-accent',
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Modo mensual (predeterminado: solo el mes actual) o vista anual completa. */
type AlmanacViewMode = 'month' | 'year';

export function AlmanacView({
  onCreateTask,
  onCompleteTask,
  onUpdateTask,
  onDeleteTask,
  onCompletionStart,
}: AlmanacViewProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState<AlmanacViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const [isAddingTask, setIsAddingTask] = useState(false);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const datedNotes = useLiveQuery(
    () => notesRepository.listScheduledBetween(yearStart, yearEnd),
    [yearStart, yearEnd],
  );
  const selectedNotes = useMemo(
    () => datedNotes?.filter((note) => note.scheduledDate === selectedDate),
    [datedNotes, selectedDate],
  );
  const datesWithNotes = useMemo(
    () => new Set((datedNotes ?? []).map((note) => note.scheduledDate ?? '')),
    [datedNotes],
  );
  const selected = new Date(
    Number(selectedDate.slice(0, 4)),
    Number(selectedDate.slice(5, 7)) - 1,
    Number(selectedDate.slice(8, 10)),
  );

  const changeYear = (nextYear: number) => {
    setYear(nextYear);
    setSelectedDate(`${nextYear}-01-01`);
    setIsAddingTask(false);
  };

  const changeMonth = (delta: number) => {
    // El desbordamiento de mes (12 + delta) ajusta el año solo: Date lo normaliza.
    const firstOfNext = new Date(year, month + delta, 1);
    setYear(firstOfNext.getFullYear());
    setMonth(firstOfNext.getMonth());
    setSelectedDate(toLocalISODate(firstOfNext));
    setIsAddingTask(false);
  };

  const toggleViewMode = () => {
    if (viewMode === 'month') {
      setViewMode('year');
    } else {
      // Al volver al modo mensual, se muestra el mes del día seleccionado.
      setMonth(selected.getMonth());
      setViewMode('month');
    }
    setIsAddingTask(false);
  };

  return (
    <section className="mx-auto w-full max-w-[500px]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Modo de vista del almanaque"
          className="flex shrink-0 rounded-full border border-border bg-surface p-0.5"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'month'}
            onClick={toggleViewMode}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
              viewMode === 'month' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
            )}
          >
            Mes
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'year'}
            onClick={toggleViewMode}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
              viewMode === 'year' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
            )}
          >
            Año
          </button>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <button
            type="button"
            aria-label={viewMode === 'month' ? 'Mes anterior' : 'Año anterior'}
            onClick={() => (viewMode === 'month' ? changeMonth(-1) : changeYear(year - 1))}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ‹
          </button>
          {viewMode === 'month' ? (
            <span className="text-center text-[13px] font-semibold capitalize">
              {MONTH_FORMATTER.format(new Date(year, month, 1))} {year}
            </span>
          ) : (
            <span className="min-w-10 text-center text-sm font-semibold">{year}</span>
          )}
          <button
            type="button"
            aria-label={viewMode === 'month' ? 'Mes siguiente' : 'Año siguiente'}
            onClick={() => (viewMode === 'month' ? changeMonth(1) : changeYear(year + 1))}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ›
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="mx-auto w-full max-w-[340px]">
          <MonthCalendar
            compact={false}
            key={`${year}-${month}`}
            year={year}
            month={month}
            selectedDate={selectedDate}
            datesWithNotes={datesWithNotes}
            onSelect={(date) => {
              setSelectedDate(date);
              setIsAddingTask(false);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 12 }, (_, calendarMonth) => (
            <MonthCalendar
              key={`${year}-${calendarMonth}`}
              year={year}
              month={calendarMonth}
              selectedDate={selectedDate}
              datesWithNotes={datesWithNotes}
              onSelect={(date) => {
                setSelectedDate(date);
                setIsAddingTask(false);
              }}
            />
          ))}
        </div>
      )}

      <section
        aria-label={`Tareas para ${formatLongDate(selected)}`}
        className="mt-4 rounded-block border border-border bg-surface p-3 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold capitalize">{formatLongDate(selected)}</h3>
          {!isAddingTask ? (
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-semibold text-accent"
            >
              + Agregar
            </button>
          ) : null}
        </div>

        {isAddingTask ? (
          <DatedTaskComposer
            date={selectedDate}
            onCreate={onCreateTask}
            onCancel={() => setIsAddingTask(false)}
          />
        ) : null}
        <div className={cn(isAddingTask && 'mt-3')}>
          <DatedNotes
            notes={selectedNotes}
            onCompletionStart={onCompletionStart}
            onComplete={onCompleteTask}
            onUpdateText={onUpdateTask}
            onDelete={onDeleteTask}
          />
        </div>
      </section>
    </section>
  );
}
