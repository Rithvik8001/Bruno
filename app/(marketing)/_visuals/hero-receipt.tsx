"use client";

import { useEffect, useState } from "react";
import { PrintIn } from "@/components/motion/rise";
import { CheckIndicator } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Receipt, ReceiptHeader } from "@/components/ui/receipt";
import { RollingNumber } from "@/components/ui/rolling-number";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { people } from "../_data";
import { heroFrame, nextStep, stepDuration } from "../_lib/hero-timeline";
import { AvatarRow } from "../_components/primitives";

function useHeroStep(): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setStep(nextStep), stepDuration(step));
    return () => clearTimeout(id);
  }, [step]);
  return step;
}

export function HeroReceipt() {
  const frame = heroFrame(useHeroStep());

  return (
    <div aria-hidden className="w-full max-w-100">
      <Receipt>
        <ReceiptHeader
          title={
            <span className="grid">
              <span>Lupa</span>
              <span className="text-footnote font-normal text-muted">Tonight · 3 people</span>
            </span>
          }
          trailing={
            <Chip tint={frame.status.tint} size="sm" dot className="transition-colors duration-220">
              {frame.status.label}
            </Chip>
          }
        />
        <div className="min-h-65">
          {frame.lines.map((line) => (
            <PrintIn
              key={line.name}
              className="grid min-h-13 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line"
            >
              <span className="flex min-w-0 items-center gap-3">
                <CheckIndicator checked={line.claimed} />
                <span className="grid min-w-0">
                  <span className="truncate font-medium">{line.name}</span>
                  <span className="min-h-4.5 text-footnote text-text-2">
                    {line.claimed ? line.by.map((id) => people[id].name).join(", ") : ""}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2.5">
                {line.claimed && <AvatarRow pop="mount" people={line.by.map((id) => people[id])} />}
                <span className="min-w-11 text-right font-medium">{formatCents(line.price)}</span>
              </span>
            </PrintIn>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 border-t border-border pt-3.5">
          {frame.totals.map((t) => {
            const person = people[t.id];
            return (
              <div key={t.id} className="grid gap-1 rounded-[12px] bg-bg px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-caption text-text-2">
                  <span data-tint={person.tint} className="size-2 rounded-full bg-tint" />
                  {person.name}
                </span>
                <RollingNumber
                  value={formatCents(t.amount)}
                  speed="live"
                  className={cn(
                    "text-[1.25rem] leading-6.5 font-semibold tracking-[-0.015em] transition-colors duration-220",
                    frame.settled ? "text-green" : "text-text",
                  )}
                />
              </div>
            );
          })}
        </div>
      </Receipt>
    </div>
  );
}
