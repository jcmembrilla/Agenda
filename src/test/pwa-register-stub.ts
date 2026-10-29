/**
 * Stub del módulo virtual de la PWA para tests.
 *
 * `virtual:pwa-register/react` solo existe cuando corre el plugin de Vite, así
 * que en Vitest se reemplaza por esta implementación mínima: mismo contrato,
 * nunca pide actualizar.
 */
export function useRegisterSW(): {
  needRefresh: [boolean, (value: boolean) => void];
  offlineReady: [boolean, (value: boolean) => void];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
} {
  return {
    needRefresh: [false, () => undefined],
    offlineReady: [false, () => undefined],
    updateServiceWorker: () => Promise.resolve(),
  };
}
