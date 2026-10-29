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
}: {
  year: number;
  month: number;
  selectedDate: string;
  datesWithNotes: Set<string>;
  onSelect: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = MONTH_FORMATTER.format(firstDay);

  return (
    <section
      aria-label={`${monthLabel} ${year}`}
      className="rounded-control border border-border bg-surface p-2.5"
    >
      <h3 className="mb-2 text-center text-xs font-semibold capitalize">{monthLabel}</h3>
      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden="true"
            className="mx-auto grid aspect-square w-full max-w-7 place-items-center text-[9px] font-medium text-muted"
          >
            {label}
          </span>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => (
          <span
            key={`empty-${index}`}
            aria-hidden="true"
            className="mx-auto aspect-square w-full max-w-7"
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
                'relative mx-auto grid aspect-square w-full max-w-7 place-items-center rounded-full text-[10px] transition-colors',
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

export function AlmanacView({
  onCreateTask,
  onCompleteTask,
  onUpdateTask,
  onDeleteTask,
  onCompletionStart,
}: AlmanacViewProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
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

  return (
    <section className="mx-auto w-full max-w-[500px]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold">Almanaque</h2>
          <p className="mt-0.5 text-xs text-muted">Tus planes en el año.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Año anterior"
            onClick={() => changeYear(year - 1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ‹
          </button>
          <span className="min-w-10 text-center text-sm font-semibold">{year}</span>
          <button
            type="button"
            aria-label="Año siguiente"
            onClick={() => changeYear(year + 1)}
            className="grid size-9 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 12 }, (_, month) => (
          <MonthCalendar
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
        ))}
      </div>

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
