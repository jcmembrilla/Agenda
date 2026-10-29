const DAY_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
});

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-AR', { month: 'long' });
const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

export function getWeekDates(date: Date): Date[] {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

export function formatMonthYear(date: Date): string {
  const month = MONTH_FORMATTER.format(date);
  return `${month.charAt(0).toLocaleUpperCase('es-AR')}${month.slice(1)} ${date.getFullYear()}`;
}

export function formatLongDate(date: Date): string {
  const formatted = LONG_DATE_FORMATTER.format(date);
  return `${formatted.charAt(0).toLocaleUpperCase('es-AR')}${formatted.slice(1)}`;
}

export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** "Hoy, viernes 23" — sin dependencias de fechas, con `Intl` del runtime. */
export function formatTodayLabel(date: Date = new Date()): string {
  const weekdayAndDay = DAY_FORMATTER.format(date).replace(',', '').replace(/\s+/g, ' ').trim();
  return `Hoy, ${weekdayAndDay}`;
}
