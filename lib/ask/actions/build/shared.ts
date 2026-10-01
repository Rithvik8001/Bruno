import "server-only";
import { createHash } from "node:crypto";
import { toGroupRef, type BillGroupRef } from "@/lib/bills/queries";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { groupId, personId, type GroupId, type PersonId } from "@/lib/domain/ids";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import type { AskClarifyQuestion } from "../../result";
import type { AskActionCard, AskDenied, AskNote } from "../card";
import type { AskIntent } from "../intent";
import type { UpdateBillInput } from "@/lib/bills/schema";
import type { PaymentMethod } from "@/lib/ledger/rules";
import type { Cents } from "@/lib/money";
import type { SettleDirection } from "@/lib/settlements/schema";

export interface BuildEnv {
  readonly now: Date;
  readonly today: string;
}

export type ExecPlan =
  | { readonly do: "remindDebts" }
  | { readonly do: "remindClaims"; readonly billId: string }
  | {
      readonly do: "recordPayment";
      readonly groupId: string;
      readonly personId: string;
      readonly direction: SettleDirection;
      readonly method: PaymentMethod;
      readonly max: Cents;
    }
  | { readonly do: "settlePending"; readonly settlementId: string }
  | { readonly do: "updateBill"; readonly input: UpdateBillInput }
  | { readonly do: "finishClaiming"; readonly billId: string }
  | { readonly do: "deleteBill"; readonly billId: string };

export type Built =
  | { readonly kind: "ready"; readonly card: AskActionCard; readonly fingerprint: string; readonly intent: AskIntent; readonly exec: ExecPlan }
  | { readonly kind: "clarify"; readonly question: AskClarifyQuestion; readonly intent: AskIntent }
  | { readonly kind: "note"; readonly note: AskNote }
  | { readonly kind: "denied"; readonly denied: AskDenied };

export const note = (value: AskNote): Built => ({ kind: "note", note: value });

export const unsupported = (reason: Extract<AskNote, { kind: "unsupported" }>["reason"], extra: Partial<Pick<Extract<AskNote, { kind: "unsupported" }>, "bill" | "group">> = {}): Built =>
  note({ kind: "unsupported", reason, bill: extra.bill ?? null, group: extra.group ?? null });

export function fingerprintOf(parts: unknown): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("base64url");
}

export interface GroupMemberFacts {
  readonly view: PersonView;
  readonly hasAccount: boolean;
}

export interface GroupFacts {
  readonly id: GroupId;
  readonly ref: BillGroupRef;
  readonly currency: CurrencyCode;
  readonly members: ReadonlyMap<PersonId, GroupMemberFacts>;
}

export async function viewerGroups(viewer: PersonId, only: string | null = null): Promise<GroupFacts[]> {
  const rows = await db.group.findMany({
    where: { deletedAt: null, members: { some: { personId: viewer, leftAt: null } }, ...(only ? { id: only } : {}) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      tint: true,
      art: true,
      currency: true,
      members: { where: { leftAt: null }, orderBy: { joinedAt: "asc" }, select: { person: { select: { ...personSelect, userId: true } } } },
    },
  });
  return rows.map((row) => ({
    id: groupId(row.id),
    ref: toGroupRef(row),
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
    members: new Map(row.members.map(({ person }) => [personId(person.id), { view: toPersonView(person), hasAccount: person.userId !== null }])),
  }));
}

export function findPerson(groups: readonly GroupFacts[], id: string | null): PersonView | null {
  if (id === null) return null;
  for (const group of groups) {
    const member = group.members.get(personId(id));
    if (member) return member.view;
  }
  return null;
}
