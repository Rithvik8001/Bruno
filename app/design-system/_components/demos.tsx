"use client";

import { useMemo, useState } from "react";
import { FlaggedLine } from "@/components/patterns/flagged-line";
import { ReceiptScan } from "@/components/patterns/receipt-scan";
import { TearOffStub } from "@/components/patterns/tear-off-stub";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/chip";
import { CommandMenu, type CommandItem } from "@/components/ui/command-menu";
import { MoneyInput } from "@/components/ui/money-input";
import { Receipt, ReceiptHeader, ReceiptLine, ReceiptRow, ReceiptSummary } from "@/components/ui/receipt";
import { RollingNumber } from "@/components/ui/rolling-number";
import { SegmentedControl, Tabs, type SegmentOption } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, sheetBodyClassName, sheetPanelClassName } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { ToastView, useToast } from "@/components/ui/toast";
import { Icon } from "@/components/icons/icon";
import { formatMoney } from "@/lib/currency";
import { useTimeline } from "@/lib/hooks/use-timeline";
import { cents, formatCents, sumCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { receiptItems, scanLines } from "../_data";

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      size="lg"
      loading={loading}
      onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1400);
      }}
    >
      Settle up
    </Button>
  );
}

export function MoneyInputDemo() {
  const [value, setValue] = useState<Cents | null>(null);
  return <MoneyInput aria-label="Amount" currency="USD" value={value} onValueChange={setValue} />;
}

type SplitMode = "amount" | "percent" | "shares";
const splitModes: readonly SegmentOption<SplitMode>[] = [
  { value: "amount", label: "Amount" },
  { value: "percent", label: "Percent" },
  { value: "shares", label: "Shares" },
];

export function SegmentedDemo() {
  const [mode, setMode] = useState<SplitMode>("amount");
  return <SegmentedControl label="Split by" options={splitModes} value={mode} onValueChange={setMode} />;
}

type BillTab = "items" | "people" | "activity";
const billTabs: readonly SegmentOption<BillTab>[] = [
  { value: "items", label: "Items" },
  { value: "people", label: "People" },
  { value: "activity", label: "Activity" },
];

export function TabsDemo() {
  const [tab, setTab] = useState<BillTab>("items");
  return <Tabs label="Bill sections" options={billTabs} value={tab} onValueChange={setTab} />;
}

const receiptTotal = sumCents(receiptItems.map((i) => i.price));

export function ClaimReceiptDemo() {
  const [claimed, setClaimed] = useState<ReadonlySet<string>>(() => new Set(["rigatoni", "tiramisu"]));
  const share = sumCents(receiptItems.filter((i) => claimed.has(i.id)).map((i) => i.price));

  const toggle = (id: string, on: boolean) =>
    setClaimed((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <Receipt className="max-w-100">
      <ReceiptHeader
        title="Lupa"
        trailing={
          <StatusChip status="claiming" size="sm">
            {claimed.size} of {receiptItems.length} claimed
          </StatusChip>
        }
      />
      {receiptItems.map((item) => {
        const mine = claimed.has(item.id);
        const who = mine ? ["You", ...item.others].join(", ") : item.others.join(", ") || "Unclaimed";
        return (
          <ReceiptLine
            key={item.id}
            name={item.name}
            price={item.price}
            caption={who}
            claimed={mine}
            onClaimedChange={(on) => toggle(item.id, on)}
          />
        );
      })}
      <ReceiptSummary
        label="Your share"
        caption={`of ${formatCents(receiptTotal)} before tip`}
        value={
          <span className="flex text-heading text-brand">
            $<RollingNumber value={formatCents(share)} />
          </span>
        }
      />
    </Receipt>
  );
}

export function StepperDemo() {
  const [ways, setWays] = useState(4);
  const total = cents(7600);
  return (
    <div className="flex flex-wrap items-center gap-5">
      <Stepper label="How many ways" value={ways} onValueChange={setWays} />
      <span className="grid">
        <span className="text-title">{formatCents(cents(Math.round(total / ways)))}</span>
        <span className="text-footnote text-text-2">each, of {formatCents(total)}</span>
      </span>
    </div>
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="grid justify-items-start gap-4">
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            message: "Settled with Sam",
            action: { label: "Undo", onAction: () => toast({ message: "Restored", icon: "check", tint: "brand" }) },
          })
        }
      >
        Show toast
      </Button>
      <ToastView message="Settled with Sam" action={{ label: "Undo", onAction: () => undefined }} />
    </div>
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  const content = {
    title: "Settle with Sam?",
    icon: { moment: "moneywings" },
    tint: "green",
    description: (
      <>
        This marks <span className="font-semibold text-text">12.40</span> as paid. Bruno keeps the record — the
        money moves wherever you two usually send it.
      </>
    ),
  } as const;

  const actions = (
    <>
      <Button size="lg" fullWidth onClick={() => setOpen(false)}>
        Yes, settled
      </Button>
      <Button variant="tertiary" fullWidth className="h-11" onClick={() => setOpen(false)}>
        Not yet
      </Button>
    </>
  );

  return (
    <div className="grid gap-4">
      <div className="flex justify-center overflow-hidden rounded-card bg-surface-2 px-4 pt-7">
        <div role="presentation" className={cn(sheetPanelClassName, "rounded-b-none sm:rounded-b-none", sheetBodyClassName)}>
          <SheetContent {...content} actions={actions} />
        </div>
      </div>
      <Button variant="secondary" className="justify-self-start" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet open={open} onOpenChange={setOpen} {...content} actions={actions} />
    </div>
  );
}

export function CommandMenuDemo() {
  const { toast } = useToast();
  const items = useMemo<readonly CommandItem[]>(() => {
    const run = (label: string) => () => toast({ message: label, icon: "sparkle", tint: "brand" });
    return [
      { id: "add", label: "Add a bill", group: "Actions", icon: "plus", tint: "violet", shortcut: "A", onSelect: run("Add a bill") },
      { id: "settle", label: "Settle up", group: "Actions", icon: "check", tint: "green", shortcut: "S", onSelect: run("Settle up") },
      { id: "lisbon", label: "Lisbon trip", group: "Groups", icon: "users", tint: "indigo", onSelect: run("Lisbon trip") },
      { id: "flat", label: "Flat 4B", group: "Groups", icon: "users", tint: "orange", onSelect: run("Flat 4B") },
      { id: "sam", label: "Sam Okafor", group: "People", icon: "user", tint: "pink", onSelect: run("Sam Okafor") },
    ];
  }, [toast]);
  return <CommandMenu items={items} />;
}

export function ReceiptScanDemo() {
  const { progress, start } = useTimeline({ steps: 34, stepMs: 110, delayMs: 250 });
  return (
    <div className="flex flex-wrap items-start gap-5">
      <ReceiptScan merchant="Lupa" lines={scanLines} total={cents(9538)} progress={progress} />
      <Button variant="secondary" onClick={start}>
        {progress === null ? "Run" : "Run again"}
      </Button>
    </div>
  );
}

const flagGuesses = [cents(900), cents(600)] as const;

export function FlaggedLineDemo() {
  const [value, setValue] = useState<Cents | null>(null);
  return (
    <div>
      <div className="max-w-105 rounded-card bg-surface px-4 py-2">
        <ReceiptRow label="Rigatoni" value="19.00" />
        <div className="border-t border-line">
          <FlaggedLine name="Tiramisu" guesses={flagGuesses} value={value} onResolve={setValue} />
        </div>
        <ReceiptRow label="Sparkling water" value="6.00" />
      </div>
      <Button variant="link" className="mt-2.5 -ml-1.5 text-footnote" onClick={() => setValue(null)}>
        Reset
      </Button>
    </div>
  );
}

export function TearOffDemo() {
  const [settled, setSettled] = useState(false);
  return (
    <TearOffStub
      className="max-w-75"
      torn={settled}
      tearOff={
        <Button fullWidth size="md" className="h-11" onClick={() => setSettled(true)}>
          Mark as paid
        </Button>
      }
      done={
        <div className="flex items-center gap-2.5">
          <span data-tint="green" className="grid size-8 place-items-center rounded-control bg-tint-bg text-tint">
            <Icon name="check" size={18} strokeWidth={2.4} />
          </span>
          <span className="flex-1 font-semibold">Settled with Sam</span>
          <Button variant="secondary" size="sm" className="font-semibold" onClick={() => setSettled(false)}>
            Undo
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold">Sam pays you</span>
        <span className="text-title">{formatMoney(cents(5240), "USD")}</span>
      </div>
    </TearOffStub>
  );
}
