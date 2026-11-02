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

/**
 * Número de semana ISO-8601: la semana 1 es la que contiene el primer jueves
 * del año y arranca en lunes. Se usa para la celda "Semana N" de la rutina.
 */
export function isoWeekNumber(date: Date): number {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Se ubica en el jueves de la semana ISO: define el año de la semana.
  target.setDate(target.getDate() + 4 - (target.getDay() || 7));
  const yearStart = new Date(target.getFullYear(), 0, 1);
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** "Hoy, viernes 23" — sin dependencias de fechas, con `Intl` del runtime. */
export function formatTodayLabel(date: Date = new Date()): string {
  const weekdayAndDay = DAY_FORMATTER.format(date).replace(',', '').replace(/\s+/g, ' ').trim();
  return `Hoy, ${weekdayAndDay}`;
}
