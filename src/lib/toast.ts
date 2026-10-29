export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
  duration: number;
}

type Listener = () => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const timers = new Map<number, number>();

function emit(): void {
  for (const listener of listeners) listener();
}

function replace(next: ToastItem[]): void {
  items = next;
  emit();
}

export function subscribeToToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastItem[] {
  return items;
}

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timers.delete(id);
  }

  if (items.some((item) => item.id === id)) {
    replace(items.filter((item) => item.id !== id));
  }
}

export interface ToastOptions {
  message: string;
  action?: ToastAction;
  /** Por defecto 4 s; "Deshacer" usa 5 s. */
  duration?: number;
}

export function showToast({ message, action, duration = 4000 }: ToastOptions): number {
  const id = nextId;
  nextId += 1;

  const toast: ToastItem = action ? { id, message, action, duration } : { id, message, duration };

  replace([...items, toast].slice(-2));
  timers.set(
    id,
    window.setTimeout(() => {
      dismissToast(id);
    }, duration),
  );

  return id;
}

export function runToastAction(id: number): void {
  const toast = items.find((item) => item.id === id);
  dismissToast(id);
  toast?.action?.onClick();
}

/** Limpia el estado global de toasts (tests). */
export function clearToasts(): void {
  for (const timer of timers.values()) {
    window.clearTimeout(timer);
  }
  timers.clear();
  replace([]);
}
