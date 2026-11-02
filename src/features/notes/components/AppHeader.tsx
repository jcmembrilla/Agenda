import { NoteIcon } from '../../../components/ui/icons';
import { InstallButton } from '../../../pwa/InstallButton';

/**
 * Marca compacta: logo chico + iniciales, centrados sobre la barra de navegación.
 * El nombre completo y la fecha solo aparecen en el splash de bienvenida
 * (`AppSplash`), para que el header ocupe lo mínimo posible.
 */
export function AppHeader() {
  return (
    <header className="shrink-0 px-5 pb-2 pt-[max(14px,env(safe-area-inset-top))] text-center">
      <div className="mx-auto flex w-fit items-center gap-2">
        <div className="grid size-8 place-items-center rounded-xl bg-accent-soft text-accent">
          <NoteIcon className="size-4" />
        </div>
        <h1 className="text-[19px] font-semibold tracking-[-0.02em]">SA</h1>
      </div>
      <InstallButton />
    </header>
  );
}
