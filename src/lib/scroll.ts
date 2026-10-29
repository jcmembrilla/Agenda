/** Scroll al tope tolerante a entornos sin `Element.scrollTo` (jsdom, WebViews viejos). */
export function scrollToTop(element: HTMLElement | null, behavior: ScrollBehavior = 'smooth'): void {
  if (!element || typeof element.scrollTo !== 'function') return;

  element.scrollTo({ top: 0, behavior });
}
