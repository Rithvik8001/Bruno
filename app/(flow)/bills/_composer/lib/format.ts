const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

export function dayLabel(iso: string, today: string, todayLabel: string): string {
  if (iso === today) return todayLabel;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return dayFormat.format(new Date(y, m - 1, d));
}
