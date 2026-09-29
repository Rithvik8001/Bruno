import { relativeDay } from "@/lib/dates";

export interface FeedDay<T> {
  readonly label: string;
  readonly items: readonly T[];
}

export function groupByDay<T extends { readonly at: Date }>(items: readonly T[], now: Date): readonly FeedDay<T>[] {
  const days: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = relativeDay(item.at, now);
    const last = days.at(-1);
    if (last && last.label === label) last.items.push(item);
    else days.push({ label, items: [item] });
  }
  return days;
}
