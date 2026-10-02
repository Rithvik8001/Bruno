import type { IconName } from "@/components/icons/icon";
import type { ActionBill, AskActionCard, AskActionOutcome, AskDenied, AskNote, ShareRow } from "@/lib/ask/actions/card";
import { routes } from "@/lib/auth/rules";
import type { BillGroupRef } from "@/lib/bills/queries";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { inlineDay, momentLabel, shortDay } from "@/lib/dates";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import type { PersonId } from "@/lib/domain/ids";
import { cents, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { askCopy } from "../_data";
import { dayDate } from "./period";

const copy = askCopy.act;
const REMIND_GAP_DAYS = 3;
const EFFECTS_SHOWN = 3;

export interface ActionEdit {
  readonly amount: Cents | null;
  readonly skip: readonly string[];
}

export interface ActionContext {
  readonly you: PersonId;
  readonly now: Date;
}

export interface BillTile {
  readonly href: string;
  readonly title: string;
  readonly group: BillGroupRef;
  readonly meta: string;
  readonly total: string;
  readonly when: string;
}

export interface PayView {
  readonly from: PersonView;
  readonly to: PersonView;
  readonly line: string;
  readonly meta: string;
  readonly currency: CurrencyCode;
  readonly editable: boolean;
  readonly amount: Cents | null;
  readonly chip: { readonly text: string; readonly tint: Tint } | null;
}

export interface PersonRowView {
  readonly key: string;
  readonly person: PersonView;
  readonly sub: string;
  readonly amount: string;
  readonly blocked: boolean;
  readonly on: boolean;
}

export interface TableRowView {
  readonly key: string;
  readonly person: PersonView;
  readonly name: string;
  readonly before: string;
  readonly after: string;
  readonly changed: boolean;
  readonly struck: boolean;
}

export interface PairView {
  readonly label: string;
  readonly before: string;
  readonly after: string;
}

export interface FactView {
  readonly label: string;
  readonly value: string;
  readonly good: boolean;
  readonly group: BillGroupRef | null;
}

export interface ActionLink {
  readonly label: string;
  readonly href: string;
}

export interface ActionView {
  readonly icon: IconName;
  readonly danger: boolean;
  readonly eyebrow: string;
  readonly title: string;
  readonly sub: string | null;
  readonly bill: BillTile | null;
  readonly pay: PayView | null;
  readonly people: readonly PersonRowView[];
  readonly checkable: boolean;
  readonly items: readonly { readonly name: string; readonly amount: string }[];
  readonly table: readonly TableRowView[];
  readonly pairs: readonly PairView[];
  readonly facts: readonly FactView[];
  readonly total: { readonly label: string; readonly values: readonly string[] } | null;
  readonly note: string | null;
  readonly primary: { readonly label: string; readonly disabled: boolean; readonly working: string };
  readonly secondary: { readonly label: string; readonly working: string } | null;
  readonly place: string;
}

export interface DoneView {
  readonly eyebrow: string;
  readonly line: string;
  readonly sub: string;
  readonly link: ActionLink;
  readonly declined: boolean;
  readonly undone: string | null;
  readonly folded: string;
}

export interface DeniedView {
  readonly view: ActionView;
  readonly alert: { readonly title: string; readonly body: string };
  readonly link: ActionLink;
}

export interface ActionNoteView {
  readonly eyebrow: string;
  readonly icon: MomentIconId;
  readonly tint: Tint;
  readonly title: string;
  readonly body: string;
  readonly quote: string | null;
  readonly primary: ActionLink | null;
  readonly link: ActionLink | null;
  readonly dismissable: boolean;
}

const first = (person: PersonView) => firstNameOf(person.displayName) || person.displayName;
const money = (amount: number, currency: CurrencyCode) => formatMoney(cents(Math.abs(amount)), currency);
const nameFor = (person: PersonView, ctx: ActionContext) => (person.id === ctx.you ? askCopy.you : first(person));
const dayLabel = (day: string, ctx: ActionContext) => shortDay(dayDate(day), ctx.now);

const blank = {
  danger: false,
  sub: null,
  bill: null,
  pay: null,
  people: [],
  checkable: false,
  items: [],
  table: [],
  pairs: [],
  facts: [],
  total: null,
  note: null,
  secondary: null,
} as const satisfies Partial<ActionView>;

function billTile(bill: ActionBill, ctx: ActionContext): BillTile {
  const split = bill.claiming ? copy.bill.claimed(bill.claiming.claimed, bill.claiming.people) : bill.method === "ITEMS" ? copy.bill.byItems : copy.bill.ways(bill.people);
  return {
    href: bill.href,
    title: bill.title,
    group: bill.group,
    meta: `${copy.bill.paid(nameFor(bill.payer, ctx))} · ${split}`,
    total: money(bill.total, bill.currency),
    when: dayLabel(bill.day, ctx),
  };
}

function shareTable(rows: readonly ShareRow[], currency: CurrencyCode, ctx: ActionContext): TableRowView[] {
  return rows.map((row) => ({
    key: row.person.id,
    person: row.person,
    name: nameFor(row.person, ctx),
    before: row.before === null ? "—" : money(row.before, currency),
    after: money(row.after, currency),
    changed: row.before !== row.after,
    struck: row.before !== null && row.before !== row.after,
  }));
}

function totalsByCurrency(rows: readonly { readonly amount: Cents; readonly currency: CurrencyCode }[]): string[] {
  const sums = new Map<CurrencyCode, number>();
  for (const row of rows) sums.set(row.currency, (sums.get(row.currency) ?? 0) + row.amount);
  return [...sums].map(([currency, amount]) => money(amount, currency));
}

function afterPayment(card: Extract<AskActionCard, { kind: "recordPayment" }>, amount: Cents | null): { text: string; good: boolean } {
  const name = first(card.other);
  const left = card.owed - (amount ?? 0);
  if (left === 0) return { text: copy.pay.square(name, card.group.name), good: true };
  const text = card.direction === "paid" ? (left > 0 ? copy.pay.stillOwe(name, money(left, card.currency)) : copy.pay.stillOwed(name, money(left, card.currency))) : left > 0 ? copy.pay.stillOwed(name, money(left, card.currency)) : copy.pay.youOwe(name, money(left, card.currency));
  return { text, good: false };
}

function afterPending(card: Extract<AskActionCard, { kind: "settlePending" }>): { text: string; good: boolean } {
  const name = first(card.other);
  if (card.after === 0) return { text: copy.pay.square(name, card.group.name), good: true };
  return { text: card.after > 0 ? copy.pay.stillOwed(name, money(card.after, card.currency)) : copy.pay.youOwe(name, money(card.after, card.currency)), good: false };
}

function effectsText(card: Extract<AskActionCard, { kind: "deleteBill" }>): string {
  const lines = card.effects.map((effect) =>
    effect.delta > 0 ? copy.remove.owesLess(first(effect.person), money(effect.delta, card.bill.currency)) : copy.remove.oweLess(first(effect.person), money(effect.delta, card.bill.currency)),
  );
  if (lines.length === 0) return copy.remove.none;
  const shown = lines.slice(0, EFFECTS_SHOWN);
  const rest = lines.length - shown.length;
  const text = copy.list(rest > 0 ? [...shown, copy.remove.more(rest)] : shown);
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function balanceText(person: PersonView, amount: Cents, currency: CurrencyCode): string {
  if (amount === 0) return copy.even;
  return amount > 0 ? copy.change.owesYou(first(person), money(amount, currency)) : copy.change.youOwe(money(amount, currency));
}

export function actionView(card: AskActionCard, edit: ActionEdit, ctx: ActionContext): ActionView {
  switch (card.kind) {
    case "remindDebts": {
      const skip = new Set(edit.skip);
      const on = card.rows.filter((row) => row.blocked === null && !skip.has(row.key));
      return {
        ...blank,
        icon: "bell",
        eyebrow: copy.remindDebts.eyebrow,
        title: card.only ? copy.remindDebts.titleOne(first(card.only)) : copy.remindDebts.title,
        sub: copy.remindDebts.sub,
        checkable: true,
        people: card.rows.map((row) => {
          const until = row.blocked?.reason === "recent" ? new Date(row.blocked.until) : null;
          const sub =
            row.blocked === null
              ? row.group.name
              : until
                ? copy.remindDebts.recent(inlineDay(new Date(until.getTime() - REMIND_GAP_DAYS * 24 * 60 * 60 * 1000), ctx.now), inlineDay(until, ctx.now))
                : row.blocked.reason === "off"
                  ? copy.remindDebts.off
                  : copy.remindDebts.noEmail;
          return { key: row.key, person: row.person, sub, amount: money(row.amount, row.currency), blocked: row.blocked !== null, on: row.blocked === null && !skip.has(row.key) };
        }),
        total: { label: copy.remindDebts.total, values: totalsByCurrency(on) },
        primary: { label: copy.remindDebts.primary(on.length), disabled: on.length === 0, working: copy.remindDebts.working(on.length) },
        place: card.rows.length === 1 ? (card.rows[0]?.group.name ?? askCopy.yourGroups) : askCopy.yourGroups,
      };
    }
    case "remindClaims": {
      const reachable = card.rows.filter((row) => row.blocked === null).length;
      return {
        ...blank,
        icon: "bell",
        eyebrow: copy.remindClaims.eyebrow,
        title: copy.remindClaims.title(card.rows.length, card.bill.title),
        sub: copy.remindClaims.sub,
        bill: billTile(card.bill, ctx),
        people: card.rows.map((row) => ({
          key: row.person.id,
          person: row.person,
          sub: row.blocked === "off" ? copy.remindClaims.off : row.blocked === "noEmail" ? copy.remindClaims.noEmail : copy.remindClaims.waiting,
          amount: "",
          blocked: row.blocked !== null,
          on: false,
        })),
        total: { label: copy.remindClaims.total, values: [money(card.unclaimed, card.bill.currency)] },
        primary: { label: copy.remindClaims.primary(reachable), disabled: reachable === 0, working: copy.remindClaims.working(reachable) },
        place: card.bill.group.name,
      };
    }
    case "recordPayment": {
      const paid = card.direction === "paid";
      const name = first(card.other);
      const amount = edit.amount;
      const over = amount !== null && amount > card.owed;
      const after = afterPayment(card, amount);
      const label = amount === null || amount <= 0 ? copy.pay.enter : paid ? copy.pay.primaryPaid(money(amount, card.currency)) : copy.pay.primaryReceived(money(amount, card.currency), name);
      return {
        ...blank,
        icon: "arrow-right",
        eyebrow: copy.pay.eyebrow,
        title: paid ? copy.pay.titlePaid(name) : copy.pay.titleReceived(name),
        pay: {
          from: paid ? card.you : card.other,
          to: paid ? card.other : card.you,
          line: paid ? copy.pay.linePaid(card.other.displayName) : copy.pay.lineReceived(card.other.displayName),
          meta: paid ? copy.pay.metaPaid(name, money(card.owed, card.currency), card.group.name) : copy.pay.metaReceived(name, money(card.owed, card.currency), card.group.name),
          currency: card.currency,
          editable: true,
          amount,
          chip: over
            ? { text: copy.pay.over(money(card.owed, card.currency)), tint: "red" }
            : amount !== null && amount > 0 && amount < card.owed
              ? { text: copy.pay.partial(money(card.owed - amount, card.currency)), tint: "amber" }
              : null,
        },
        facts: [
          { label: copy.group, value: card.group.name, good: false, group: card.group },
          ...(over || amount === null ? [] : [{ label: copy.afterThis, value: after.text, good: after.good, group: null }]),
        ],
        note: paid ? (card.needsConfirm ? copy.pay.noteConfirm(name) : copy.pay.noteGuest) : copy.pay.noteReceived(name),
        primary: { label, disabled: amount === null || amount <= 0 || over, working: copy.pay.working(money(amount ?? 0, card.currency)) },
        place: card.group.name,
      };
    }
    case "settlePending": {
      const name = first(card.other);
      const amount = money(card.amount, card.currency);
      const when = new Date(card.at);
      const after = afterPending(card);
      return {
        ...blank,
        icon: "check-circle",
        eyebrow: copy.pending.eyebrow,
        title: copy.pending.title(name, amount),
        sub: copy.pending.sub(name, inlineDay(when, ctx.now)),
        pay: {
          from: card.other,
          to: card.you,
          line: copy.pay.lineReceived(card.other.displayName),
          meta: momentLabel(when, ctx.now),
          currency: card.currency,
          editable: false,
          amount: card.amount,
          chip: null,
        },
        facts: [
          { label: copy.group, value: card.group.name, good: false, group: card.group },
          { label: copy.ifConfirm, value: after.text, good: after.good, group: null },
        ],
        note: copy.pending.note(name),
        primary: { label: copy.pending.primary(amount), disabled: false, working: copy.pending.working(amount) },
        secondary: { label: copy.pending.decline, working: copy.pending.declining },
        place: card.group.name,
      };
    }
    case "splitEvenly": {
      const each = money(card.each, card.bill.currency);
      return {
        ...blank,
        icon: "pencil",
        eyebrow: copy.change.eyebrow,
        title: copy.change.splitTitle(card.bill.title),
        sub: [copy.change.splitSub(card.rows.length, each), card.closes ? copy.change.splitCloses : null].filter(Boolean).join(" "),
        bill: billTile(card.bill, ctx),
        table: shareTable(card.rows, card.bill.currency, ctx),
        note: copy.change.seen,
        primary: { label: copy.change.splitPrimary(money(card.bill.total, card.bill.currency), card.rows.length), disabled: false, working: copy.change.splitWorking },
        place: card.bill.group.name,
      };
    }
    case "changePayer": {
      const name = first(card.to);
      return {
        ...blank,
        icon: "pencil",
        eyebrow: copy.change.eyebrow,
        title: copy.change.payerTitle(name, card.bill.title),
        bill: billTile(card.bill, ctx),
        pairs: [
          { label: copy.paidBy, before: nameFor(card.bill.payer, ctx), after: card.to.id === ctx.you ? askCopy.you : card.to.displayName },
          ...card.moves.map((move) => ({
            label: copy.change.payerMove(first(move.person), card.bill.group.name),
            before: balanceText(move.person, move.before, card.bill.currency),
            after: balanceText(move.person, move.after, card.bill.currency),
          })),
        ],
        note: `${copy.change.payerNote} ${copy.change.seen}`,
        primary: { label: copy.change.payerPrimary(name, money(card.bill.total, card.bill.currency)), disabled: false, working: copy.change.payerWorking },
        place: card.bill.group.name,
      };
    }
    case "renameBill":
      return {
        ...blank,
        icon: "pencil",
        eyebrow: copy.change.eyebrow,
        title: copy.change.renameTitle(card.bill.title),
        bill: billTile(card.bill, ctx),
        pairs: [{ label: copy.name, before: card.bill.title, after: card.title }],
        note: copy.change.renameNote,
        primary: { label: copy.change.renamePrimary, disabled: false, working: copy.change.renameWorking },
        place: card.bill.group.name,
      };
    case "changeDate":
      return {
        ...blank,
        icon: "pencil",
        eyebrow: copy.change.eyebrow,
        title: copy.change.dateTitle(card.bill.title, dayLabel(card.day, ctx)),
        bill: billTile(card.bill, ctx),
        pairs: [{ label: copy.date, before: dayLabel(card.bill.day, ctx), after: dayLabel(card.day, ctx) }],
        note: copy.change.renameNote,
        primary: { label: copy.change.datePrimary, disabled: false, working: copy.change.dateWorking },
        place: card.bill.group.name,
      };
    case "changeTotal": {
      const total = money(card.total, card.bill.currency);
      return {
        ...blank,
        icon: "pencil",
        eyebrow: copy.change.eyebrow,
        title: copy.change.totalTitle(card.bill.title, total),
        bill: billTile(card.bill, ctx),
        pairs: [{ label: copy.total, before: money(card.bill.total, card.bill.currency), after: total }],
        table: shareTable(card.rows, card.bill.currency, ctx),
        note: copy.change.seen,
        primary: { label: copy.change.totalPrimary(total), disabled: false, working: copy.change.totalWorking },
        place: card.bill.group.name,
      };
    }
    case "finishClaiming": {
      const open = money(card.unclaimed, card.bill.currency);
      return {
        ...blank,
        icon: "check-square",
        eyebrow: copy.close.eyebrow,
        title: copy.close.title(card.bill.title),
        sub: card.unclaimed > 0 ? copy.close.sub(open) : copy.close.subNone,
        bill: billTile(card.bill, ctx),
        items: card.items.map((item) => ({ name: item.name, amount: money(item.price, card.bill.currency) })),
        table: shareTable(card.rows, card.bill.currency, ctx),
        note: copy.close.note,
        primary: { label: card.unclaimed > 0 ? copy.close.primary(open) : copy.close.primaryNone, disabled: false, working: copy.close.working },
        place: card.bill.group.name,
      };
    }
    case "deleteBill":
      return {
        ...blank,
        icon: "trash",
        danger: true,
        eyebrow: copy.remove.eyebrow,
        title: copy.remove.title(card.bill.title),
        sub: copy.remove.sub(card.bill.group.name),
        bill: billTile(card.bill, ctx),
        facts: [{ label: copy.afterThis, value: effectsText(card), good: false, group: null }],
        primary: { label: copy.remove.primary, disabled: false, working: copy.remove.working },
        place: card.bill.group.name,
      };
  }
}

export function doneView(card: AskActionCard, outcome: AskActionOutcome, ctx: ActionContext): DoneView {
  const eyebrow = actionView(card, { amount: null, skip: [] }, ctx).eyebrow;
  const base = { eyebrow, declined: false, undone: null } as const;
  switch (card.kind) {
    case "remindDebts": {
      const groups = [...new Set(card.rows.map((row) => row.group.id))];
      const [only] = card.rows;
      const count = outcome.names.length;
      return {
        ...base,
        line: copy.remindDebts.done(count),
        sub: copy.remindDebts.doneSub(copy.list(outcome.names)),
        link: groups.length === 1 && only ? { label: copy.remindDebts.link(only.group.name), href: routes.groupTab(only.group.id, "balances") } : { label: copy.remindDebts.linkAll, href: routes.groups },
        folded: copy.remindDebts.folded(count),
      };
    }
    case "remindClaims":
      return {
        ...base,
        line: copy.remindClaims.done(copy.list(outcome.names), card.bill.title),
        sub: copy.remindClaims.doneSub,
        link: { label: copy.bill.openNamed(card.bill.title), href: card.bill.href },
        folded: copy.remindClaims.folded(outcome.names.length, card.bill.title),
      };
    case "recordPayment": {
      const paid = card.direction === "paid";
      const name = first(card.other);
      const amount = money(outcome.amount ?? 0, card.currency);
      return {
        ...base,
        line: paid ? copy.pay.donePaid(amount, name) : copy.pay.doneReceived(amount, name),
        sub: outcome.pending ? copy.pay.donePending(name, card.group.name) : `${afterPayment(card, outcome.amount).text}.`,
        link: { label: copy.pay.link, href: routes.groupTab(card.group.id, "balances") },
        undone: paid ? copy.pay.undonePaid(amount, name) : copy.pay.undoneReceived(amount, name),
        folded: paid ? copy.pay.foldedPaid(amount, name, outcome.pending) : copy.pay.foldedReceived(amount, name),
      };
    }
    case "settlePending": {
      const name = first(card.other);
      const amount = money(card.amount, card.currency);
      const declined = outcome.decision === "decline";
      return {
        ...base,
        declined,
        line: declined ? copy.pending.declined(name, amount) : copy.pending.done(amount, name),
        sub: declined ? copy.pending.declinedSub(name) : `${afterPending(card).text}.`,
        link: { label: copy.pay.link, href: routes.groupTab(card.group.id, "balances") },
        folded: declined ? copy.pending.foldedDeclined(name, amount) : copy.pending.folded(amount, name),
      };
    }
    case "splitEvenly": {
      const each = money(card.each, card.bill.currency);
      return {
        ...base,
        line: copy.change.splitDone(card.bill.title),
        sub: copy.change.splitDoneSub(each, card.closes),
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.change.splitFolded(card.bill.title, each),
      };
    }
    case "changePayer":
      return {
        ...base,
        line: copy.change.payerDone(first(card.to), card.bill.title),
        sub: copy.change.seen,
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.change.payerFolded(first(card.to), card.bill.title),
      };
    case "renameBill":
      return {
        ...base,
        line: copy.change.renameDone(card.title),
        sub: copy.change.renameDoneSub,
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.change.renameFolded(card.title),
      };
    case "changeDate":
      return {
        ...base,
        line: copy.change.dateDone(dayLabel(card.day, ctx)),
        sub: copy.change.renameDoneSub,
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.change.dateFolded(card.bill.title, dayLabel(card.day, ctx)),
      };
    case "changeTotal": {
      const total = money(card.total, card.bill.currency);
      return {
        ...base,
        line: copy.change.totalDone(card.bill.title, total),
        sub: copy.change.seen,
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.change.totalFolded(card.bill.title, total),
      };
    }
    case "finishClaiming":
      return {
        ...base,
        line: copy.close.done(card.bill.title),
        sub: card.unclaimed > 0 ? copy.close.doneSub : copy.close.doneSubNone,
        link: { label: copy.bill.open, href: card.bill.href },
        folded: copy.close.folded(card.bill.title),
      };
    case "deleteBill":
      return {
        ...base,
        line: copy.remove.done(card.bill.title),
        sub: card.effects.length > 0 ? `${effectsText(card)}.` : copy.remove.doneSubNone,
        link: { label: copy.remove.link(card.bill.group.name), href: routes.group(card.bill.group.id) },
        folded: copy.remove.folded(card.bill.title),
      };
  }
}

const deniedIcon = { remindClaims: "bell", splitEvenly: "pencil", changePayer: "pencil", renameBill: "pencil", changeDate: "pencil", changeTotal: "pencil", finishClaiming: "check-square", deleteBill: "trash" } as const satisfies Record<Extract<AskDenied, { kind: "billDenied" }>["action"], IconName>;

export function deniedView(denied: AskDenied, ctx: ActionContext): DeniedView {
  const primary = { label: "", disabled: true, working: "" };
  if (denied.kind === "billDenied") {
    const owner = denied.owner.displayName;
    return {
      view: {
        ...blank,
        icon: deniedIcon[denied.action],
        eyebrow: denied.action === "deleteBill" ? copy.remove.eyebrow : denied.action === "finishClaiming" ? copy.close.eyebrow : denied.action === "remindClaims" ? copy.remindClaims.eyebrow : copy.change.eyebrow,
        title: copy.denied.billTitle[denied.action](denied.bill.title),
        bill: billTile(denied.bill, ctx),
        primary,
        place: denied.bill.group.name,
      },
      alert: { title: copy.denied.bill(owner), body: copy.denied.billBody(first(denied.owner)) },
      link: { label: copy.bill.open, href: denied.bill.href },
    };
  }
  const amount = denied.amount !== null && denied.currency !== null ? money(denied.amount, denied.currency) : null;
  return {
    view: {
      ...blank,
      icon: "arrow-right",
      eyebrow: copy.pay.eyebrow,
      title: copy.denied.payTitle(first(denied.from), first(denied.to), amount),
      pay:
        denied.amount !== null && denied.currency !== null
          ? {
              from: denied.from,
              to: denied.to,
              line: copy.denied.payLine(first(denied.from), denied.to.displayName),
              meta: denied.group?.name ?? "",
              currency: denied.currency,
              editable: false,
              amount: denied.amount,
              chip: null,
            }
          : null,
      facts: denied.group ? [{ label: copy.group, value: denied.group.name, good: false, group: denied.group }] : [],
      primary,
      place: denied.group?.name ?? askCopy.yourGroups,
    },
    alert: { title: copy.denied.pay(first(denied.to), first(denied.from)), body: copy.denied.payBody },
    link: denied.group ? { label: copy.denied.openGroup(denied.group.name), href: routes.group(denied.group.id) } : { label: copy.denied.home, href: routes.app },
  };
}

export function noteView(note: AskNote): ActionNoteView {
  const text = copy.note;
  const nothing = { eyebrow: text.eyebrowNothing, icon: "check", tint: "green", quote: null, primary: null, link: null, dismissable: false } as const;
  switch (note.kind) {
    case "handoff":
      return {
        eyebrow: text.eyebrowHandoff,
        icon: "memo",
        tint: "blue",
        title: text.handoffTitle,
        body: note.carries ? text.handoffBody : text.handoffBodyPick,
        quote: note.text,
        primary: { label: note.carries ? text.handoffOpen : text.handoffPick, href: note.href },
        link: null,
        dismissable: true,
      };
    case "square":
      return { ...nothing, title: text.square(note.other.displayName), body: text.squareBody(note.group?.name ?? null) };
    case "awaiting":
      return { ...nothing, icon: "hourglass", tint: "amber", title: text.awaiting(first(note.other)), body: text.awaitingBody(money(note.amount, note.currency), first(note.other), note.group.name) };
    case "wrongWay": {
      const name = first(note.other);
      const amount = money(note.amount, note.currency);
      return note.theyOwe
        ? { ...nothing, icon: "moneybag", tint: "blue", title: text.theyOwe(name), body: text.theyOweBody(note.group.name, name, amount) }
        : { ...nothing, icon: "moneybag", tint: "blue", title: text.youOwe(name), body: text.youOweBody(note.group.name, name, amount) };
    }
    case "nobodyOwes":
      return { ...nothing, title: note.other ? text.nobodyOwesOne(first(note.other)) : text.nobodyOwes, body: text.nobodyOwesBody };
    case "noPending":
      return { ...nothing, title: note.other ? text.noPendingOne(first(note.other)) : text.noPending, body: text.noPendingBody };
    case "allClaimed":
      return { ...nothing, title: text.allClaimed(note.bill.title), body: text.allClaimedBody, link: { label: copy.bill.open, href: note.bill.href } };
    case "noChange":
      return { ...nothing, title: text.noChange(note.bill.title), body: text.noChangeBody, link: { label: copy.bill.open, href: note.bill.href } };
    case "unsupported": {
      const words = text.unsupported[note.reason];
      const link = note.bill
        ? note.reason === "simpleBill"
          ? { label: copy.bill.editor, href: note.bill.editHref }
          : { label: copy.bill.open, href: note.bill.href }
        : note.group
          ? { label: copy.denied.openGroup(note.group.name), href: routes.group(note.group.id) }
          : null;
      return { eyebrow: text.eyebrowUnsupported, icon: "lock", tint: "neutral", title: words.title, body: words.body, quote: null, primary: null, link, dismissable: false };
    }
  }
}
