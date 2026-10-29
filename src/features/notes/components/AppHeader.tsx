import { formatTodayLabel } from '../../../lib/dates';
import { NoteIcon } from '../../../components/ui/icons';
import { InstallButton } from '../../../pwa/InstallButton';

export function AppHeader() {
  return (
    <header className="shrink-0 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))] text-center">
      <div className="mx-auto mb-2 grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
        <NoteIcon className="size-5" />
      </div>
      <h1 className="text-[22px] font-semibold tracking-[-0.025em]">Simple Agenda</h1>
      <p className="mt-1 text-[12px] text-muted">{formatTodayLabel()}</p>
      <InstallButton />
    </header>
  );
}
