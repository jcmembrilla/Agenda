import { useSyncExternalStore } from 'react';
import { getToasts, runToastAction, subscribeToToasts } from '../../lib/toast';

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts, getToasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+104px)] z-50 flex justify-center px-4"
    >
      <ul className="flex w-full max-w-[560px] flex-col gap-2">
        {toasts.map((toast) => (
          <li
            key={toast.id}
            className="animate-toast-in pointer-events-auto flex items-center gap-3 rounded-control bg-ink px-4 py-3 text-canvas shadow-lg"
          >
            <span className="flex-1 text-[13.5px] leading-snug">{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                onClick={() => {
                  runToastAction(toast.id);
                }}
                className="-mr-1 rounded-full px-2 py-1 text-[13px] font-semibold underline decoration-2 underline-offset-2"
              >
                {toast.action.label}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
