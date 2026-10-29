const DAY_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
});

/** "Hoy, viernes 23" — sin dependencias de fechas, con `Intl` del runtime. */
export function formatTodayLabel(date: Date = new Date()): string {
  const weekdayAndDay = DAY_FORMATTER.format(date).replace(',', '').replace(/\s+/g, ' ').trim();
  return `Hoy, ${weekdayAndDay}`;
}
