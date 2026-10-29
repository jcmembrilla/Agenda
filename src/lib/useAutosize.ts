import { useLayoutEffect, type RefObject } from 'react';

/**
 * Ajusta la altura de un `textarea` a su contenido, con techo.
 *
 * Se usa `style.height = 'auto'` antes de leer `scrollHeight` para que el
 * cálculo no dependa de la altura anterior. Es la única medición de layout de
 * toda la app y corre en un `useLayoutEffect` (sin parpadeo).
 */
export function useAutosize(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight = 96,
): void {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, maxHeight]);
}
