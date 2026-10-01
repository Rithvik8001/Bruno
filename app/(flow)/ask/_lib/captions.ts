import { bucketLabel } from "@/lib/bills/buckets";
import type { AskStep } from "@/lib/ask/result";
import { firstNameOf } from "@/lib/people/defaults";
import { askCopy } from "../_data";

const copy = askCopy.thinking;

export function captionFor(steps: readonly AskStep[], yourName: string): string {
  const step = steps.at(-1);
  if (!step) return copy.reading;
  const name = (value: string | null) => (value === null ? null : value === yourName ? askCopy.youLower : firstNameOf(value));
  const a = name(step.a);
  const b = name(step.b);
  switch (step.tool) {
    case "balance":
      if (a && b) return copy.balancePair(a, b);
      if (a) return a === askCopy.youLower ? copy.balanceOneYou : copy.balanceOne(`${a} stands`);
      return copy.balanceAll(step.group);
    case "explain":
      return copy.explain(b ?? a ?? askCopy.someone.toLowerCase(), step.group);
    case "spending":
      return copy.spending(step.bucket ? bucketLabel[step.bucket].toLowerCase() : null, step.group);
    case "bills":
      return copy.bills(a === askCopy.youLower ? null : a);
    case "findBills":
      return copy.find(step.title);
    case "history":
      return copy.history(step.title);
  }
}
