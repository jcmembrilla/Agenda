import { useRef } from 'react';
import type { TouchEvent } from 'react';
import type { AppSection } from './useHashTab';

const SECTION_ORDER: ReadonlyArray<AppSection> = [
  'economy',
  'eisenhower',
  'personal-notes',
  'tasks',
  'routine',
  'almanac',
];
/** Un deslizado corto pero decidido: menos que eso es un toque o un scroll interrumpido. */
const MIN_SWIPE_PX = 60;
/** Gesto más horizontal que vertical, para no robarle el scroll vertical a las listas. */
const HORIZONTAL_RATIO = 1.5;
const MAX_DURATION_MS = 900;
const MAX_MULTI_TOUCH = 1;

/**
 * Navegación entre Notas/Tareas/Rutina/Almanaque con el dedo: deslizando a la
 * izquierda avanza a la sección siguiente, a la derecha vuelve a la anterior.
 * Devuelve los handlers para el contenedor de los paneles.
 */
export function useSwipeNavigation(
  section: AppSection,
  onChange: (section: AppSection) => void,
): {
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
} {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    if (!touch || event.touches.length > MAX_MULTI_TOUCH) {
      start.current = null;
      return;
    }
    start.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const duration = Date.now() - origin.time;
    if (duration > MAX_DURATION_MS) return;
    if (Math.abs(dx) < MIN_SWIPE_PX || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;

    const index = SECTION_ORDER.indexOf(section);
    if (index < 0) return;
    const nextIndex = index + (dx < 0 ? 1 : -1);
    const next = SECTION_ORDER[nextIndex];
    if (!next) return;
    onChange(next);
  };

  return { onTouchStart, onTouchEnd };
}
