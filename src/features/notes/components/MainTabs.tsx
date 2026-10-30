import { useRef, type KeyboardEvent } from 'react';
import { CalendarIcon, NoteIcon, RoutineIcon } from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import type { AppSection } from '../hooks/useHashTab';

interface MainTabsProps {
  value: AppSection;
  onChange: (section: AppSection) => void;
}

const TABS: ReadonlyArray<{
  value: AppSection;
  label: string;
  Icon: typeof NoteIcon;
}> = [
  { value: 'tasks', label: 'Tareas', Icon: NoteIcon },
  { value: 'routine', label: 'Rutina', Icon: RoutineIcon },
  { value: 'almanac', label: 'Almanaque', Icon: CalendarIcon },
];

export function MainTabs({ value, onChange }: MainTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index + TABS.length - 1) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = TABS[nextIndex];
    if (!nextTab) return;
    onChange(nextTab.value);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Áreas principales"
      className="flex w-full gap-1 border-y border-border/70 bg-surface px-4 py-2"
    >
      {TABS.map(({ value: tab, label, Icon }, index) => (
        <button
          key={tab}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="button"
          role="tab"
          id={`tab-${tab}`}
          aria-selected={value === tab}
          aria-controls={`panel-${tab}`}
          tabIndex={value === tab ? 0 : -1}
          onClick={() => onChange(tab)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className={cn(
            'flex h-10 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-control px-1.5 text-[12px] font-semibold transition-colors sm:gap-1.5 sm:px-3.5 sm:text-[13px]',
            value !== tab && 'text-muted hover:bg-canvas hover:text-ink',
            value === tab &&
              (tab === 'tasks'
                ? 'bg-accent-soft text-accent'
                : tab === 'routine'
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'),
          )}
        >
          <Icon className="size-3.5 shrink-0 sm:size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
