import type { BillStatus } from "@/lib/bills/types";
import type { CurrencyCode } from "@/lib/currency";
import { isAllSquare } from "@/lib/ledger/balances";
import type { Cents } from "@/lib/money";
import type { GroupId, PersonId } from "./ids";

export const GROUP_ROLES = ["ADMIN", "MEMBER"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

export interface Membership {
  readonly groupId: GroupId;
  readonly personId: PersonId;
  readonly role: GroupRole;
  readonly leftAt: Date | null;
}

export interface BillAccess {
  readonly groupId: GroupId | null;
  readonly createdById: PersonId;
  readonly status: BillStatus;
  readonly deletedAt: Date | null;
}

const isActiveAdmin = (membership: Membership | null, groupId: GroupId | null): boolean =>
  membership !== null &&
  groupId !== null &&
  membership.groupId === groupId &&
  membership.leftAt === null &&
  membership.role === "ADMIN";

export function canEditBill(actor: PersonId, bill: BillAccess, membership: Membership | null): boolean {
  if (bill.deletedAt !== null) return false;
  return bill.createdById === actor || isActiveAdmin(membership, bill.groupId);
}

export function canClaim(bill: BillAccess): boolean {
  return bill.deletedAt === null && bill.status === "CLAIMING";
}

export function canLeaveGroup(balances: ReadonlyMap<CurrencyCode, Cents>): boolean {
  return isAllSquare(balances);
}
