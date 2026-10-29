/** Nombre de la animación de colapso, definido en `styles/index.css`. */
export const COLLAPSE_ANIMATION_NAME = 'note-collapse';

/** Duración total de la animación de completado (check + tachado + colapso). */
export const COLLAPSE_DURATION_MS = 700;

/** Red de seguridad: `animationend` no se dispara en pestañas ocultas. */
export const COLLAPSE_TIMEOUT_MS = 900;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Espera a que termine una animación concreta sobre `element`.
 *
 * Filtra por `animationName` porque las animaciones de los hijos (check, texto)
 * también burbujean `animationend`: sin el filtro, el commit se adelantaría.
 * Si la pestaña está en segundo plano el evento nunca llega, de ahí el timeout.
 */
export function waitForMotionEnd(
  element: HTMLElement | null,
  animationName: string,
  timeoutMs: number,
): Promise<void> {
  if (!element) {
    return sleep(COLLAPSE_DURATION_MS);
  }

  return new Promise<void>((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      element.removeEventListener('animationend', handleEnd);
      window.clearTimeout(timer);
      resolve();
    };

    const handleEnd = (event: AnimationEvent): void => {
      if (event.animationName === animationName) {
        finish();
      }
    };

    const timer = window.setTimeout(finish, timeoutMs);
    element.addEventListener('animationend', handleEnd);
  });
}
