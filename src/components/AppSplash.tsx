import { formatTodayLabel } from '../lib/dates';
import { NoteIcon } from './ui/icons';

/**
 * Pantalla de bienvenida: se muestra cada vez que se abre la app.
 *
 * Una "barrida" revela el logo y el nombre grandes, centrados en pantalla con la
 * fecha del día; el conjunto se desvanece y deja visible la app con la marca
 * compacta del header. No se invoca con `prefers-reduced-motion` activado.
 */
export function AppSplash() {
  return (
    <div aria-hidden="true" className="app-splash">
      <div className="app-splash__content">
        <div className="grid size-20 place-items-center rounded-3xl bg-accent-soft text-accent shadow-sm">
          <NoteIcon className="size-9" />
        </div>
        <h1 className="text-[30px] font-semibold tracking-[-0.03em]">Simple Agenda</h1>
        <p className="text-[15px] text-muted">{formatTodayLabel()}</p>
      </div>
    </div>
  );
}
