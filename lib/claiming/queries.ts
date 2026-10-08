import "server-only";
import { routes } from "@/lib/auth/rules";
import type { AppContext } from "@/lib/auth/session";
import { toGroupRef, type BillGroupRef } from "@/lib/bills/queries";
import { billInputFromRow, billSplitSelect, tipFromRow } from "@/lib/bills/rows";
import { computeShares } from "@/lib/bills/split";
import type { BillCharges } from "@/lib/bills/types";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { db } from "@/lib/db";
import { billId, lineItemId, personId, type BillId, type LineItemId } from "@/lib/domain/ids";
import { canEditBill } from "@/lib/domain/permissions";
import { cents, ZERO_CENTS, type Cents } from "@/lib/money";
import { personSelect, toPersonView, type PersonView } from "@/lib/people/person";
import { appUrl, displayUrl } from "@/lib/site";
import type { ClaimedItem } from "@/lib/bills/messages";
import { resolveClaimer, type ClaimerKind } from "./viewer";

export interface LiveItem {
  readonly id: LineItemId;
  readonly name: string;
  readonly quantity: number;
  readonly price: Cents;
  readonly claimants: readonly PersonView[];
}

export interface LiveViewer {
  readonly kind: ClaimerKind;
  readonly person: PersonView;
}

interface LiveBase {
  readonly id: BillId;
  readonly code: string;
  readonly slug: string;
  readonly title: string;
  readonly occurredAt: Date;
  readonly currency: CurrencyCode;
  readonly group: BillGroupRef;
  readonly payer: PersonView;
  readonly viewer: LiveViewer | null;
  readonly signedIn: boolean;
}

export interface ClaimingBill extends LiveBase {
  readonly status: "claiming";
  readonly items: readonly LiveItem[];
  readonly charges: BillCharges;
  readonly guests: readonly PersonView[];
  readonly waitingOn: readonly PersonView[];
  readonly canManage: boolean;
  readonly shareUrl: string;
  readonly shareLabel: string;
}

export interface FinishedBill extends LiveBase {
  readonly status: "finished";
  readonly total: Cents;
  readonly yourShare: Cents | null;
  readonly yourItems: readonly ClaimedItem[];
  readonly owers: readonly PersonView[];
}

export type LiveBill = ClaimingBill | FinishedBill;

export async function getLiveBill(code: string, viewer: AppContext | null): Promise<LiveBill | null> {
  const row = await db.bill.findFirst({
    where: { claimCode: code, deletedAt: null, status: { in: ["CLAIMING", "FINALIZED"] }, group: { deletedAt: null } },
    select: {
      id: true,
      slug: true,
      title: true,
      occurredAt: true,
      currency: true,
      status: true,
      createdById: true,
      deletedAt: true,
      totalCents: true,
      groupId: true,
      payer: { select: personSelect },
      group: {
        select: {
          id: true,
          name: true,
          tint: true,
          art: true,
          members: {
            where: { leftAt: null, person: { mergedIntoId: null } },
            orderBy: { joinedAt: "asc" },
            select: { person: { select: { ...personSelect, userId: true } } },
          },
        },
      },
      ...billSplitSelect,
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          quantity: true,
          priceCents: true,
          claims: { orderBy: { createdAt: "asc" }, select: { personId: true, person: { select: personSelect } } },
        },
      },
    },
  });
  if (!row || !row.group || !row.groupId) return null;

  const claimer = await resolveClaimer(row.groupId, viewer);
  const base: LiveBase = {
    id: billId(row.id),
    code,
    slug: row.slug,
    title: row.title,
    occurredAt: row.occurredAt,
    currency: isCurrencyCode(row.currency) ? row.currency : DEFAULT_CURRENCY,
    group: toGroupRef(row.group),
    payer: toPersonView(row.payer),
    viewer: claimer ? { kind: claimer.kind, person: claimer.person } : null,
    signedIn: viewer !== null,
  };

  if (row.status === "FINALIZED") {
    const split = computeShares(billInputFromRow(row));
    const you = claimer ? claimer.person.id : null;
    const yourItems: ClaimedItem[] = row.items.flatMap((item) =>
      you !== null && item.claims.some((c) => c.personId === you) ? [{ name: item.name, ways: item.claims.length }] : [],
    );
    const mine =
      you !== null && split.ok && yourItems.length > 0 ? (split.value.shares.get(personId(you))?.total ?? ZERO_CENTS) : null;
    const people = new Map(row.group.members.map((m) => [m.person.id, m.person]));
    const owers = split.ok
      ? [...split.value.shares].flatMap(([id, share]) => {
          const person = people.get(id);
          return id !== row.payer.id && share.total > 0 && person ? [toPersonView(person)] : [];
        })
      : [];
    return { ...base, status: "finished", total: cents(row.totalCents), yourShare: mine, yourItems, owers };
  }

  const claimed = new Set(row.items.flatMap((item) => item.claims.map((c) => c.personId)));
  const members = row.group.members.map((m) => m.person);

  const shareUrl = appUrl(routes.claimBill(code));
  return {
    ...base,
    status: "claiming",
    items: row.items.map((item) => ({
      id: lineItemId(item.id),
      name: item.name,
      quantity: item.quantity,
      price: cents(item.priceCents),
      claimants: item.claims.map((claim) => toPersonView(claim.person)),
    })),
    charges: { taxCents: cents(row.taxCents), tip: tipFromRow(row), discountCents: cents(row.discountCents) },
    guests: members.filter((m) => m.userId === null).map(toPersonView),
    waitingOn: members
      .filter(
        (m) =>
          m.userId !== null &&
          !claimed.has(m.id) &&
          m.id !== row.payer.id &&
          m.id !== row.createdById &&
          m.id !== claimer?.person.id,
      )
      .map(toPersonView),
    canManage:
      claimer?.access.kind === "member" &&
      canEditBill(
        personId(claimer.person.id),
        { groupId: base.group.id, createdById: personId(row.createdById), status: row.status, deletedAt: row.deletedAt },
        claimer.access.membership,
      ),
    shareUrl,
    shareLabel: displayUrl(shareUrl),
  };
}
