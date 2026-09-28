import type { ReactNode } from "react";
import { AmountChip } from "@/components/ui/chip";
import { typeScale, type TypeScaleKey } from "@/lib/design-system/tokens";
import { cents, formatCents, sumCents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { DocSection, Eyebrow, Panel } from "../_components/doc";

const specimens: ReadonlyArray<{ key: TypeScaleKey; sample: ReactNode; className: string }> = [
  {
    key: "display",
    className: "text-display",
    sample: (
      <>
        You&apos;re owed <span className="text-green">$84.20</span>
      </>
    ),
  },
  { key: "heading", className: "text-heading", sample: "Dinner at Lupa" },
  { key: "title", className: "text-title", sample: "Who had the negronis?" },
  { key: "body", className: "text-body", sample: "Sam owes you 12.40. Tap a line to claim it, or split what’s left evenly." },
  { key: "small", className: "text-small text-text-2", sample: "Paid by Priya · Tuesday, 4 Sep" },
  { key: "caption", className: "text-caption text-muted", sample: "3 of 5 claimed" },
];

function spec(key: TypeScaleKey): string {
  const s = typeScale[key];
  const tracking = s.tracking === 0 ? "0" : `−${String(Math.abs(s.tracking)).replace(/^0/, "")}em`;
  return `${key} · ${s.size}/${s.lineHeight} · ${tracking} · ${s.weight}`;
}

const figures = [
  { label: "Burrata", value: cents(1400) },
  { label: "Rigatoni", value: cents(1900) },
  { label: "Negroni ×2", value: cents(2800) },
] as const;

export function TypeSection() {
  return (
    <DocSection
      index={3}
      title="Type"
      description="Inter with the rounded alternates (cv11, ss01). Six core sizes, weights 400 / 500 / 600. Figures are tabular. Sentence case everywhere."
    >
      <div className="grid">
        {specimens.map((s) => (
          <div
            key={s.key}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 border-b border-line py-4.5"
          >
            <span className={cn(s.className)}>{s.sample}</span>
            <span className="text-caption font-normal whitespace-nowrap text-muted">{spec(s.key)}</span>
          </div>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-5">
        <Panel>
          <Eyebrow>Figures — tabular, weight 600</Eyebrow>
          <div className="grid gap-1.5">
            {figures.map((f) => (
              <div key={f.label} className="flex justify-between">
                <span>{f.label}</span>
                <span className="font-medium">{formatCents(f.value)}</span>
              </div>
            ))}
            <div className="mt-0.5 flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCents(sumCents(figures.map((f) => f.value)))}</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <Eyebrow>Direction — tint + sign</Eyebrow>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Sam owes you</span>
              <AmountChip amount={cents(1240)} className="h-7" />
            </div>
            <div className="flex items-center justify-between">
              <span>You owe Priya</span>
              <AmountChip amount={cents(-810)} className="h-7" />
            </div>
            <div className="flex items-center justify-between">
              <span>Settled with Ana</span>
              <AmountChip amount={cents(0)} className="h-7" />
            </div>
          </div>
        </Panel>
      </div>
    </DocSection>
  );
}
