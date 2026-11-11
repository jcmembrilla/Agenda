import { useRef, useState, type KeyboardEvent } from 'react';
import {
  CalendarIcon,
  GridIcon,
  MemoIcon,
  NoteIcon,
  PlusIcon,
  RoutineIcon,
  WalletIcon,
} from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import { InstallButton } from '../../../pwa/InstallButton';
import type { AppSection } from '../hooks/useHashTab';

interface MainTabsProps {
  value: AppSection;
  eisenhowerAdded: boolean;
  economyAdded: boolean;
  onChange: (section: AppSection) => void;
  onAddEisenhower: () => void;
  onAddEconomy: () => void;
}

const BASE_TABS: ReadonlyArray<{
  value: AppSection;
  label: string;
  Icon: typeof NoteIcon;
}> = [
  { value: 'personal-notes', label: 'Notas', Icon: MemoIcon },
  { value: 'tasks', label: 'Tareas', Icon: NoteIcon },
  { value: 'routine', label: 'Rutina', Icon: RoutineIcon },
  { value: 'almanac', label: 'Almanaque', Icon: CalendarIcon },
];

export function MainTabs({
  value,
  eisenhowerAdded,
  economyAdded,
  onChange,
  onAddEisenhower,
  onAddEconomy,
}: MainTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [showTools, setShowTools] = useState(false);
  const tabs = [
    ...(economyAdded ? [{ value: 'economy' as const, label: 'Economía', Icon: WalletIcon }] : []),
    ...(eisenhowerAdded
      ? [{ value: 'eisenhower' as const, label: 'Pendientes', Icon: GridIcon }]
      : []),
    ...BASE_TABS,
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    onChange(nextTab.value);
    refs.current[nextIndex]?.focus();
  };

  return (
    <div className="relative flex w-full items-center gap-1 border-y border-border/70 bg-surface px-2 py-2 sm:px-4">
      <div
        role="tablist"
        aria-label="Áreas principales"
        className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto"
      >
        {tabs.map(({ value: tab, label, Icon }, index) => (
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
              'flex h-10 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-control px-2 text-[12px] font-semibold transition-colors sm:gap-1.5 sm:px-3.5 sm:text-[13px]',
              value !== tab && 'text-muted hover:bg-canvas hover:text-ink',
              value === tab &&
                (tab === 'tasks'
                  ? 'bg-accent-soft text-accent'
                  : tab === 'routine'
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                    : tab === 'almanac'
                      ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
                      : tab === 'eisenhower'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
                        : tab === 'economy'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-border/60 text-ink'),
            )}
          >
            <Icon className="size-3.5 shrink-0 sm:size-4" />
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Otras herramientas"
        aria-expanded={showTools}
        aria-haspopup="dialog"
        aria-controls="other-tools-menu"
        onClick={() => setShowTools((current) => !current)}
        className="grid size-10 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <PlusIcon className="size-5" />
      </button>
      {showTools ? (
        <div
          id="other-tools-menu"
          role="dialog"
          aria-label="Otras herramientas"
          className="absolute right-2 top-full z-40 mt-2 w-56 rounded-block border border-border bg-surface p-2 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              setShowTools(false);
              onAddEisenhower();
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            <GridIcon className="size-4 text-orange-600" />
            Pendientes
            {eisenhowerAdded ? (
              <span className="ml-auto text-[11px] font-medium text-muted">Añadido</span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowTools(false);
              onAddEconomy();
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
          >
            <WalletIcon className="size-4 text-emerald-600" />
            Economía
            {economyAdded ? (
              <span className="ml-auto text-[11px] font-medium text-muted">Añadida</span>
            ) : null}
          </button>
          <div className="border-t border-border/70 px-2 pt-2">
            <InstallButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
