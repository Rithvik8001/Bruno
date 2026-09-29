export const BILL_EVENTS = ["claims", "status"] as const;

export type BillEvent = (typeof BILL_EVENTS)[number];

export interface ClaimSignal {
  readonly personId: string;
  readonly name: string;
  readonly item: string | null;
  readonly on: boolean;
  readonly joined: boolean;
}

export function billTopic(code: string): string {
  return `claim:${code}`;
}

export function isClaimSignal(value: unknown): value is ClaimSignal {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.personId === "string" &&
    typeof v.name === "string" &&
    (typeof v.item === "string" || v.item === null) &&
    typeof v.on === "boolean" &&
    typeof v.joined === "boolean"
  );
}
