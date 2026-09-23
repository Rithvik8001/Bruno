const formatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" });

export function formatHour(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return formatter.format(date);
}
