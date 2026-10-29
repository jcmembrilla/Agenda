import { formatTodayLabel } from '../../../lib/dates';

export function AppHeader() {
  return (
    <header className="shrink-0 px-5 pb-3 pt-[max(18px,env(safe-area-inset-top))]">
      <h1 className="text-[22px] font-semibold tracking-[-0.015em]">Anotador</h1>
      <p className="mt-0.5 text-[12px] text-muted">{formatTodayLabel()}</p>
    </header>
  );
}
