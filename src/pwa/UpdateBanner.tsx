import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Ciclo de actualización explícito: nunca se recarga sola. Si hay una versión
 * nueva, se ofrece; el usuario decide cuándo aplicarla para no perder lo que
 * está escribiendo en el composer.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="shrink-0 px-4 pb-2">
      <div
        role="status"
        className="flex items-center gap-3 rounded-control border border-border bg-surface px-3 py-2"
      >
        <p className="flex-1 text-[12px] text-muted">Hay una versión nueva disponible.</p>

        <button
          type="button"
          onClick={() => {
            void updateServiceWorker(true);
          }}
          className="rounded-full px-2 py-1 text-[12px] font-semibold text-accent"
        >
          Actualizar
        </button>

        <button
          type="button"
          aria-label="Descartar aviso de actualización"
          onClick={() => {
            setNeedRefresh(false);
          }}
          className="grid size-7 place-items-center rounded-full text-muted"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="size-3.5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
