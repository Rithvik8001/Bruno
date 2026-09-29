"use client";

import type { ReactNode } from "react";
import { AmountInput } from "@/components/ui/amount-input";
import type { BillTotals } from "@/lib/bills/types";
import { formatAmount, formatMoney, type CurrencyCode } from "@/lib/currency";
import type { Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { composerCopy, TIP_PRESETS } from "../data";
import type { BillDraft, DraftTip } from "../lib/draft";

export interface ChargesProps {
  draft: BillDraft;
  subtotal: Cents;
  totals: BillTotals | null;
  currency: CurrencyCode;
  onTax: (tax: Cents | null) => void;
  onTip: (tip: DraftTip) => void;
  onDiscount: (discount: Cents | null) => void;
}

function ChargeRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_120px] items-center gap-2">
      <span className="flex items-center gap-2 text-small text-text-2">{label}</span>
      {children}
    </div>
  );
}

function TipPresets({ tip, onTip }: { tip: DraftTip; onTip: (tip: DraftTip) => void }) {
  return (
    <span role="radiogroup" aria-label={composerCopy.items.tipPresets} className="inline-flex gap-0.5 rounded-sm bg-surface-2 p-0.5">
      {TIP_PRESETS.map((percent) => {
        const selected = tip.mode === "percent" && tip.percent === percent;
        return (
          <button
            key={percent}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onTip(selected ? { mode: "none" } : { mode: "percent", percent })}
            className={cn(
              "h-5.5 cursor-pointer rounded-xs px-1.75 text-[11px] font-semibold transition-[background-color,color] duration-150 ease-standard",
              selected ? "bg-bg text-text shadow-thumb" : "bg-transparent text-muted hover:text-text",
            )}
          >
            {percent}%
          </button>
        );
      })}
    </span>
  );
}

export function Charges({ draft, subtotal, totals, currency, onTax, onTip, onDiscount }: ChargesProps) {
  const copy = composerCopy.items;
  const tipShown = draft.tip.mode === "amount" ? draft.tip.amount : draft.tip.mode === "percent" ? (totals?.tip ?? null) : null;
  const hasDiscount = draft.discount !== null && draft.discount > 0;

  return (
    <div className="grid gap-0.5 border-t border-border pt-2.5">
      <ChargeRow label={copy.subtotal}>
        <span className="px-2.5 text-right font-medium">{formatAmount(subtotal, currency)}</span>
      </ChargeRow>
      <ChargeRow label={copy.tax}>
        <AmountInput value={draft.tax} onValueChange={onTax} currency={currency} aria-label={copy.tax} />
      </ChargeRow>
      <ChargeRow
        label={
          <>
            {copy.tip}
            <TipPresets tip={draft.tip} onTip={onTip} />
          </>
        }
      >
        <AmountInput
          value={tipShown}
          onValueChange={(amount) => onTip({ mode: "amount", amount })}
          currency={currency}
          aria-label={copy.tip}
        />
      </ChargeRow>
      <ChargeRow label={copy.discount}>
        <span className="flex items-center">
          <span aria-hidden className={cn("font-semibold text-green", !hasDiscount && "invisible")}>
            −
          </span>
          <AmountInput
            value={draft.discount}
            onValueChange={onDiscount}
            currency={currency}
            tone="positive"
            aria-label={copy.discount}
          />
        </span>
      </ChargeRow>
      <div className="mt-1 grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-line">
        <span className="font-semibold">{copy.total}</span>
        <span className="px-2.5 text-right text-title font-semibold">
          {totals ? formatMoney(totals.total, currency) : copy.noTotal}
        </span>
      </div>
    </div>
  );
}
