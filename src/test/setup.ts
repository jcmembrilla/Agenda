import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { clearToasts } from '../lib/toast';

afterEach(() => {
  cleanup();
  clearToasts();
});

/**
 * jsdom no implementa `matchMedia`. El default es "sin preferencias"; los tests
 * de movimiento reducido lo sobrescriben con `setReducedMotion`.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList,
});
