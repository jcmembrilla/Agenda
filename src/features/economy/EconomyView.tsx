import { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { showToast } from '../../lib/toast';
import { useEconomyEntries } from './hooks/useEconomyEntries';
import { economyRepository, monthlyAmount } from './economy.repository';
import type {
  EconomyCategory,
  EconomyEntry,
  EconomyEntryInput,
  EconomyFrequency,
} from './economy.types';

const GROUPS: ReadonlyArray<{
  category: EconomyCategory;
  section: 'Ingresos' | 'Gastos' | 'Ahorro e inversión';
  title: string;
  guidance: string;
  placeholder: string;
  periodic?: boolean;
}> = [
  {
    category: 'income-fixed',
    section: 'Ingresos',
    title: 'Ingresos fijos',
    guidance: 'La base segura para organizar el mes.',
    placeholder: 'Ej. sueldo',
  },
  {
    category: 'income-extra',
    section: 'Ingresos',
    title: 'Ingresos extras',
    guidance: 'Destinalos a objetivos, deudas o imprevistos.',
    placeholder: 'Ej. trabajo independiente',
  },
  {
    category: 'expense-fixed',
    section: 'Gastos',
    title: 'Gastos fijos',
    guidance: 'Pagos obligatorios que se repiten.',
    placeholder: 'Ej. alquiler, servicios',
  },
  {
    category: 'expense-variable',
    section: 'Gastos',
    title: 'Gastos variables',
    guidance: 'Consumos flexibles del día a día.',
    placeholder: 'Ej. supermercado, salidas',
  },
  {
    category: 'expense-periodic',
    section: 'Gastos',
    title: 'Gastos periódicos',
    guidance: 'Se prorratean para reservar un monto mensual.',
    placeholder: 'Ej. patente, vacaciones',
    periodic: true,
  },
  {
    category: 'saving-emergency',
    section: 'Ahorro e inversión',
    title: 'Fondo de emergencia',
    guidance: 'Reserva disponible para imprevistos.',
    placeholder: 'Ej. aporte al fondo',
  },
  {
    category: 'saving-goal',
    section: 'Ahorro e inversión',
    title: 'Ahorro para objetivos',
    guidance: 'Metas concretas de mediano plazo.',
    placeholder: 'Ej. vacaciones, herramientas',
  },
  {
    category: 'saving-investment',
    section: 'Ahorro e inversión',
    title: 'Inversión',
    guidance: 'Aportes de largo plazo.',
    placeholder: 'Ej. inversión mensual',
  },
];

const FREQUENCIES: ReadonlyArray<{ value: EconomyFrequency; label: string }> = [
  { value: 'monthly', label: 'Cada mes' },
  { value: 'quarterly', label: 'Cada 3 meses' },
  { value: 'yearly', label: 'Una vez al año' },
];

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(amount);
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  const [year, value] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    new Date(year ?? 2000, (value ?? 1) - 1, 15),
  );
}

function shiftMonth(month: string, offset: number): string {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year ?? 2000, (value ?? 1) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function EntryForm({
  month,
  category,
  periodic,
  placeholder,
  entry,
  onSaved,
}: {
  month: string;
  category: EconomyCategory;
  periodic: boolean;
  placeholder: string;
  entry?: EconomyEntry;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(entry?.label ?? '');
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '');
  const [frequency, setFrequency] = useState<EconomyFrequency>(entry?.frequency ?? 'monthly');
  const [isSaving, setIsSaving] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      showToast({ message: 'Ingresá un importe válido.' });
      return;
    }

    setIsSaving(true);
    try {
      const input: EconomyEntryInput = {
        month,
        category,
        label,
        amount: parsedAmount,
        frequency: periodic ? frequency : 'monthly',
      };
      if (entry) {
        await economyRepository.update(entry.id, input);
      } else {
        await economyRepository.create(input);
      }
      onSaved();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar el movimiento.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="mt-2 rounded-control border border-border bg-canvas p-2.5"
    >
      <label className="sr-only" htmlFor={`economy-label-${category}`}>
        Nombre del movimiento
      </label>
      <input
        id={`economy-label-${category}`}
        value={label}
        maxLength={100}
        onChange={(event) => setLabel(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-control border border-border bg-surface px-3 text-[15px] focus:border-accent/50 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Importe en pesos</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted">$</span>
          <input
            type="number"
            aria-label="Importe en pesos"
            min="0"
            max="1000000000000"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            className="h-10 w-full rounded-control border border-border bg-surface pl-7 pr-2 text-[16px] tabular-nums focus:border-accent/50 focus:outline-none"
          />
        </label>
        {periodic ? (
          <label className="min-w-0 flex-1">
            <span className="sr-only">Frecuencia del gasto</span>
            <select
              aria-label="Frecuencia del gasto"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as EconomyFrequency)}
              className="h-10 w-full rounded-control border border-border bg-surface px-2 text-[12px] focus:border-accent/50 focus:outline-none"
            >
              {FREQUENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onSaved}
          className="h-9 rounded-full px-3 text-[12px] font-medium text-muted hover:bg-border/50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!label.trim() || amount === '' || isSaving}
          className="h-9 rounded-full bg-accent px-4 text-[12px] font-semibold text-canvas disabled:opacity-40"
        >
          {isSaving ? 'Guardando…' : entry ? 'Guardar cambios' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

function EconomyGroup({
  month,
  group,
  entries,
}: {
  month: string;
  group: (typeof GROUPS)[number];
  entries: EconomyEntry[];
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const groupEntries = entries.filter((entry) => entry.category === group.category);
  const total = groupEntries.reduce(
    (sum, entry) => sum + monthlyAmount(entry.amount, entry.frequency),
    0,
  );

  const remove = async (id: string) => {
    try {
      await economyRepository.remove(id);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : 'No se pudo eliminar el movimiento.',
      });
    }
  };

  return (
    <section className="rounded-block border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold">{group.title}</h3>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{group.guidance}</p>
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>

      {groupEntries.length > 0 ? (
        <ul className="mt-2 divide-y divide-border/70">
          {groupEntries.map((entry) => (
            <li key={entry.id} className="py-2 first:pt-1">
              {editingId === entry.id ? (
                <EntryForm
                  month={month}
                  category={group.category}
                  periodic={Boolean(group.periodic)}
                  placeholder={group.placeholder}
                  entry={entry}
                  onSaved={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[13px] font-medium">{entry.label}</p>
                    <p className="text-[11px] tabular-nums text-muted">
                      {formatCurrency(entry.amount)}
                      {group.periodic && entry.frequency !== 'monthly'
                        ? ` · ${FREQUENCIES.find(({ value }) => value === entry.frequency)?.label.toLowerCase()}`
                        : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar ${entry.label}`}
                    onClick={() => {
                      setAdding(false);
                      setEditingId(entry.id);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                  >
                    <EditIcon className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${entry.label}`}
                    onClick={() => void remove(entry.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-muted">Todavía no agregaste movimientos.</p>
      )}

      {adding ? (
        <EntryForm
          month={month}
          category={group.category}
          periodic={Boolean(group.periodic)}
          placeholder={group.placeholder}
          onSaved={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="mt-2 flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          <PlusIcon className="size-4" />
          Agregar movimiento
        </button>
      )}
    </section>
  );
}

export function EconomyView() {
  const [month, setMonth] = useState(currentMonth);
  const entries = useEconomyEntries(month);
  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        total: (entries ?? [])
          .filter((entry) => entry.category === group.category)
          .reduce((sum, entry) => sum + monthlyAmount(entry.amount, entry.frequency), 0),
      })),
    [entries],
  );
  const incomes = groups
    .filter(({ section }) => section === 'Ingresos')
    .reduce((sum, group) => sum + group.total, 0);
  const expenses = groups
    .filter(({ section }) => section === 'Gastos')
    .reduce((sum, group) => sum + group.total, 0);
  const savings = groups
    .filter(({ section }) => section === 'Ahorro e inversión')
    .reduce((sum, group) => sum + group.total, 0);
  const balance = Math.round((incomes - expenses - savings) * 100) / 100;
  const selectedGroups = (section: (typeof GROUPS)[number]['section']) =>
    groups.filter((group) => group.section === section);

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-4 pb-2">
      <header className="flex items-center gap-2 px-1">
        <CalendarIcon className="size-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold capitalize">Economía mensual</h2>
          <p className="text-[11px] text-muted">Un presupuesto claro, a tu ritmo.</p>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 rounded-block border border-border bg-surface p-2.5">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMonth((current) => shiftMonth(current, -1))}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
        </button>
        <label className="min-w-0 flex-1 text-center">
          <span className="sr-only">Mes del presupuesto</span>
          <span className="block text-[13px] font-semibold capitalize">{monthLabel(month)}</span>
          <input
            type="month"
            aria-label="Elegir mes del presupuesto"
            value={month}
            onChange={(event) => {
              if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) {
                setMonth(event.target.value);
              }
            }}
            className="h-6 max-w-full border-0 bg-transparent text-center text-[11px] text-muted focus:outline-none"
          />
        </label>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMonth((current) => shiftMonth(current, 1))}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
        >
          <ArrowRightIcon className="size-4" />
        </button>
      </div>

      <section
        aria-label="Balance mensual"
        className={cn(
          'rounded-block border p-4 shadow-sm',
          balance < 0
            ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100'
            : 'border-accent/30 bg-accent-soft text-ink',
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
          Balance estimado
        </p>
        <p className="mt-1 text-[28px] font-bold tabular-nums tracking-tight">
          {formatCurrency(balance)}
        </p>
        <p className="mt-1 text-[12px] font-medium">
          {balance < 0
            ? 'Déficit: revisá los gastos flexibles o tus reservas.'
            : balance > 0
              ? 'Superávit: podés destinar el margen a nuevas metas.'
              : 'Ingresos, gastos y ahorro están equilibrados.'}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-current/10 pt-3 text-[10px]">
          <div>
            <p className="opacity-70">Ingresos</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(incomes)}</p>
          </div>
          <div>
            <p className="opacity-70">Gastos</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(expenses)}</p>
          </div>
          <div>
            <p className="opacity-70">Ahorro</p>
            <p className="mt-0.5 font-semibold tabular-nums">{formatCurrency(savings)}</p>
          </div>
        </div>
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-muted">
        El balance resta gastos y ahorro de los ingresos. Los gastos periódicos se cuentan como una
        reserva mensual según su frecuencia.
      </p>

      {(['Ingresos', 'Gastos', 'Ahorro e inversión'] as const).map((section) => (
        <section key={section} aria-label={section} className="space-y-2.5">
          <h2 className="px-1 text-[14px] font-bold">{section}</h2>
          {selectedGroups(section).map((group) => (
            <EconomyGroup
              key={group.category}
              month={month}
              group={group}
              entries={entries ?? []}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
