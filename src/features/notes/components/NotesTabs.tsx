import { useRef, type KeyboardEvent } from 'react';
import { cn } from '../../../lib/cn';
import type { NoteCounts } from '../notes.repository';
import type { NoteStatus } from '../notes.types';

interface NotesTabsProps {
  value: NoteStatus;
  counts: NoteCounts | undefined;
  onChange: (status: NoteStatus) => void;
}

const TABS: ReadonlyArray<{ status: NoteStatus; label: string }> = [
  { status: 'pending', label: 'Pendientes' },
  { status: 'done', label: 'Realizadas' },
];

export function NotesTabs({ value, counts, onChange }: NotesTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    if (!nextTab) return;

    onChange(nextTab.status);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Secciones de Simple Agenda"
      className="mx-auto inline-flex gap-1 rounded-full border border-border bg-surface p-1 shadow-sm"
    >
      {TABS.map((tab, index) => {
        const isSelected = tab.status === value;
        const count = tab.status === 'pending' ? counts?.pending : counts?.done;

        return (
          <button
            key={tab.status}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.status}`}
            aria-selected={isSelected}
            aria-controls={`panel-${tab.status}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => {
              onChange(tab.status);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, index);
            }}
            className={cn(
              'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold',
              'transition-colors duration-150',
              isSelected ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink',
            )}
          >
            {tab.label}
            {count ? (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1 text-center text-[11px] leading-5 tabular-nums',
                  isSelected ? 'bg-accent/15 text-accent' : 'bg-border/60 text-muted',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
