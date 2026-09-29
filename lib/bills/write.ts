import type { BillTipValue, BillValues } from "./schema";

export interface ParticipantRow {
  readonly personId: string;
  readonly shares: number;
  readonly percentBps: number | null;
  readonly amountCents: number | null;
}

export function peopleOnBill(values: Pick<BillValues, "method" | "items" | "participants">): string[] {
  return values.method === "ITEMS"
    ? values.items.flatMap((item) => item.claimedBy)
    : values.participants.map((p) => p.personId);
}

export function participantRows(values: Pick<BillValues, "method" | "items" | "participants">): ParticipantRow[] {
  if (values.method === "ITEMS") {
    return [...new Set(peopleOnBill(values))].map((personId) => ({ personId, shares: 1, percentBps: null, amountCents: null }));
  }
  return values.participants.map((p) => ({
    personId: p.personId,
    shares: values.method === "SHARES" ? p.shares : 1,
    percentBps: values.method === "PERCENT" ? p.percentBps : null,
    amountCents: values.method === "AMOUNT" ? p.amountCents : null,
  }));
}

export function tipColumns(tip: BillTipValue) {
  switch (tip.kind) {
    case "NONE":
      return { tipKind: "NONE", tipValue: 0 } as const;
    case "PERCENT":
      return { tipKind: "PERCENT", tipValue: tip.bps } as const;
    case "AMOUNT":
      return { tipKind: "AMOUNT", tipValue: tip.cents } as const;
  }
}

export function itemCreates(values: Pick<BillValues, "method" | "items">) {
  return values.items.map((item, position) => ({
    name: item.name,
    quantity: item.quantity,
    priceCents: item.priceCents,
    position,
    claims: values.method === "ITEMS" ? { create: item.claimedBy.map((personId) => ({ personId })) } : undefined,
  }));
}

export function occurredAtOf(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}
