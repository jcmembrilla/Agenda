import { useCallback, useRef, useState, type RefObject } from 'react';
import {
  COLLAPSE_ANIMATION_NAME,
  COLLAPSE_TIMEOUT_MS,
  prefersReducedMotion,
  waitForMotionEnd,
} from '../../../lib/motion';

export type CompletionPhase = 'idle' | 'completing';

export interface CompletionAnimation<E extends HTMLElement = HTMLElement> {
  phase: CompletionPhase;
  /** Se pasa al wrapper que tiene el colapso. */
  containerRef: RefObject<E | null>;
  complete: () => Promise<void>;
  isCompleting: boolean;
}

/**
 * Máquina de estados del completado: `idle → completing → commit`.
 *
 * El commit se ejecuta **después** de la animación, no al tocar el check. Si se
 * escribiera antes, `liveQuery` desmontaría el bloque en el mismo frame y no
 * habría nada que animar (ADR-05).
 */
export function useCompleteAnimation<E extends HTMLElement = HTMLElement>(
  onComplete: () => Promise<unknown>,
): CompletionAnimation<E> {
  const [phase, setPhase] = useState<CompletionPhase>('idle');
  const guard = useRef(false);
  const containerRef = useRef<E>(null);

  const complete = useCallback(async () => {
    if (guard.current) return;
    guard.current = true;

    // Sin animación no hay nada que esperar: se persiste y listo.
    if (prefersReducedMotion()) {
      try {
        await onComplete();
      } finally {
        guard.current = false;
      }
      return;
    }

    setPhase('completing');

    await waitForMotionEnd(containerRef.current, COLLAPSE_ANIMATION_NAME, COLLAPSE_TIMEOUT_MS);

    try {
      await onComplete();
    } catch (error) {
      // La UI vuelve atrás: el bloque tiene que reaparecer tal como estaba.
      setPhase('idle');
      throw error;
    } finally {
      guard.current = false;
    }
  }, [onComplete]);

  return { phase, containerRef, complete, isCompleting: phase === 'completing' };
}
