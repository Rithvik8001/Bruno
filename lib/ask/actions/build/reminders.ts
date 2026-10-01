import "server-only";
import type { PersonId } from "@/lib/domain/ids";
import { balancesWith, inScope } from "@/lib/ledger/balances";
import { loadGroupLedgers } from "@/lib/ledger/load";
import { pendingBetween } from "@/lib/ledger/pair";
import { cents, sumCents } from "@/lib/money";
import { debtPairKey, recentDebtReminders } from "@/lib/notifications/events/debts";
import { emailRecipients } from "@/lib/notifications/recipients";
import type { ClaimerRow, DebtRow, RemindBlock } from "../card";
import type { AskIntent } from "../intent";
import { REMIND_PEOPLE_MAX } from "../kinds";
import { loadActionBill } from "./bill";
import { findPerson, note, unsupported, viewerGroups, type BuildEnv, type Built } from "./shared";

async function emailBlocks(ids: readonly string[], category: "weekly" | "bills"): Promise<Map<string, "off" | "noEmail">> {
  const [reachable, willing] = await Promise.all([emailRecipients(ids, null), emailRecipients(ids, category)]);
  const hasEmail = new Set<string>(reachable.map((recipient) => recipient.personId));
  const allows = new Set<string>(willing.map((recipient) => recipient.personId));
  return new Map(ids.flatMap((id): [string, "off" | "noEmail"][] => (allows.has(id) ? [] : [[id, hasEmail.has(id) ? "off" : "noEmail"]])));
}

export async function buildRemindDebts(viewer: PersonId, intent: AskIntent, env: BuildEnv): Promise<Built> {
  const groups = await viewerGroups(viewer, intent.groupId);
  const only = intent.personId === null ? null : findPerson(groups, intent.personId);
  if (intent.personId !== null && (!only || only.id === viewer)) return unsupported("needsPerson");
  const ledger = await loadGroupLedgers(groups.map((group) => group.id));

  const owed = groups.flatMap((group) => {
    const debts = inScope(ledger.debts, group.id);
    const settlements = inScope(ledger.settlements, group.id);
    const balances = balancesWith(viewer, debts, settlements, env.now).get(group.currency);
    return [...(balances ?? [])].flatMap(([id, balance]) => {
      const member = group.members.get(id);
      if (!member || balance <= 0 || (only && only.id !== id)) return [];
      const pending = sumCents(pendingBetween(settlements, id, viewer, { groupId: group.id, currency: group.currency }, env.now).map((entry) => entry.amount));
      const amount = cents(balance - pending);
      return amount > 0 ? [{ group, person: member.view, amount }] : [];
    });
  });
  if (owed.length === 0) return note({ kind: "nobodyOwes", other: only });

  const shown = [...owed].sort((a, b) => b.amount - a.amount).slice(0, REMIND_PEOPLE_MAX);
  const ids = [...new Set(shown.map((entry) => entry.person.id as string))];
  const [blocks, recent] = await Promise.all([
    emailBlocks(ids, "weekly"),
    recentDebtReminders(
      viewer,
      shown.map((entry) => ({ groupId: entry.group.id, debtorId: entry.person.id })),
      env.now,
    ),
  ]);
  const rows: DebtRow[] = shown.map((entry) => {
    const key = debtPairKey({ groupId: entry.group.id, debtorId: entry.person.id });
    const until = recent.get(key);
    const email = blocks.get(entry.person.id);
    const blocked: RemindBlock | null = email ? { reason: email } : until ? { reason: "recent", until: until.toISOString() } : null;
    return { key, person: entry.person, group: entry.group.ref, amount: entry.amount, currency: entry.group.currency, blocked };
  });
  return {
    kind: "ready",
    card: { kind: "remindDebts", only, rows },
    fingerprint: "open",
    intent,
    exec: { do: "remindDebts" },
  };
}

export async function buildRemindClaims(viewer: PersonId, intent: AskIntent, billId: string): Promise<Built> {
  const loaded = await loadActionBill(viewer, billId);
  if (!loaded) return unsupported("billGone");
  if (!loaded.claiming) return unsupported("notClaiming", { bill: loaded.bill });
  if (!loaded.canEdit) return { kind: "denied", denied: { kind: "billDenied", action: "remindClaims", bill: loaded.bill, owner: loaded.creator } };

  const claimed = new Set(loaded.values.items.flatMap((item) => item.claimedBy));
  const waiting = loaded.active.filter((member) => member.id !== viewer && member.id !== loaded.values.payerId && !claimed.has(member.id));
  if (waiting.length === 0) return note({ kind: "allClaimed", bill: loaded.bill });
  const blocks = await emailBlocks(
    waiting.map((member) => member.id),
    "bills",
  );
  const rows: ClaimerRow[] = waiting.map((person) => ({ person, blocked: blocks.get(person.id) ?? null }));
  const unclaimed = sumCents(loaded.values.items.filter((item) => item.claimedBy.length === 0).map((item) => cents(item.priceCents)));
  return {
    kind: "ready",
    card: { kind: "remindClaims", bill: loaded.bill, rows, unclaimed },
    fingerprint: "open",
    intent: { ...intent, billId },
    exec: { do: "remindClaims", billId },
  };
}
