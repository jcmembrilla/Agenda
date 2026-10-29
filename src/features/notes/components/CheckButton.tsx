import { cn } from '../../../lib/cn';
import type { CompletionPhase } from '../hooks/useCompleteAnimation';

interface CheckButtonProps {
  phase: CompletionPhase;
  onPress: () => void;
}

/**
 * El trazo del check está oculto por defecto (`stroke-dashoffset: 1`) y lo
 * dibuja la animación de completado. La clase `.note-check` es la que se rellena
 * de verde cuando el bloque entra en fase `completing`.
 */
export function CheckButton({ phase, onPress }: CheckButtonProps) {
  const isCompleting = phase === 'completing';

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="Marcar como realizada"
      aria-busy={isCompleting}
      disabled={isCompleting}
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full',
        'active:scale-95 disabled:cursor-default',
      )}
    >
      <span
        className={cn(
          'note-check grid size-7 place-items-center rounded-full',
          'border-[1.5px] border-border text-canvas',
          'hover:border-muted/60',
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true" focusable="false">
          <path
            className="note-check-path"
            d="M6.5 12.5 10.5 16.5 17.5 8.5"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1}
          />
        </svg>
      </span>
    </button>
  );
}
