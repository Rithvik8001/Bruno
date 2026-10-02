import { feedLine } from "@/app/(app)/activity/_lib/view";
import type {
  ActivityCard,
  AskBill,
  AskCard,
  AskScope,
  BalanceCard,
  DeclineCard,
  EmptyCard,
  ListCard,
  RankCard,
  SpendCard,
  WhyCard,
} from "@/lib/ask/result";
import { routes } from "@/lib/auth/rules";
import { bucketLabel, bucketTint } from "@/lib/bills/buckets";
import type { BillGroupRef } from "@/lib/bills/queries";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { inlineDay, momentLabel, shortDay } from "@/lib/dates";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { PaletteTint, Tint } from "@/lib/design-system/tokens";
import type { PersonId } from "@/lib/domain/ids";
import type { FeedItem } from "@/lib/feed/types";
import { cents, type Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { askCopy } from "../_data";
import { dayDate, monthLabel, periodLabel } from "./period";

export type Tone = "in" | "out" | "plain" | "muted";

export type Lead =
  | { readonly kind: "person"; readonly person: PersonView }
  | { readonly kind: "group"; readonly group: BillGroupRef }
  | { readonly kind: "bill" }
  | { readonly kind: "payment" }
  | { readonly kind: "moment"; readonly moment: MomentIconId; readonly tint: PaletteTint }
  | { readonly kind: "sparkle" };

export interface HeadView {
  readonly caption: string;
  readonly amount: string;
  readonly tone: Tone;
  readonly sub: string;
  readonly word: boolean;
}

export interface SegmentView {
  readonly key: string;
  readonly label: string;
  readonly amount: string;
  readonly weight: number;
  readonly tint: PaletteTint;
}

export interface MonthBar {
  readonly key: string;
  readonly label: string;
  readonly amount: string;
  readonly height: number;
  readonly on: boolean;
}

export interface RowView {
  readonly key: string;
  readonly lead: Lead;
  readonly title: string;
  readonly sub: string;
  readonly amount: string;
  readonly tone: Tone;
  readonly run: string;
  readonly href: string | null;
}

export interface BillView {
  readonly key: string;
  readonly href: string;
  readonly title: string;
  readonly chip: { readonly label: string; readonly tint: Tint } | null;
  readonly meta: string;
  readonly total: string;
  readonly when: string;
}

export interface NoteView {
  readonly icon: MomentIconId;
  readonly tint: Tint;
  readonly title: string;
  readonly body: string;
}

export interface LinkView {
  readonly label: string;
  readonly href: string;
  readonly primary: boolean;
}

export interface ActView {
  readonly label: string;
  readonly icon: "arrow-right" | "bell";
  readonly intent: { readonly action: "recordPayment" | "remindDebts"; readonly personId: string; readonly groupId: string | null };
}

export interface AskLinkView {
  readonly label: string;
  readonly question: string;
}

export interface CardView {
  readonly eyebrow: { readonly lead: Lead; readonly text: string };
  readonly heads: readonly HeadView[];
  readonly headsNote: string | null;
  readonly segments: readonly SegmentView[];
  readonly months: readonly MonthBar[];
  readonly rowsHead: { readonly left: string; readonly right: string } | null;
  readonly rows: readonly RowView[];
  readonly net: { readonly label: string; readonly amount: string; readonly tone: Tone } | null;
  readonly billsHead: string | null;
  readonly bills: readonly BillView[];
  readonly billsCap: number | null;
  readonly more: { readonly label: string; readonly href: string } | null;
  readonly note: NoteView | null;
  readonly examples: readonly string[];
  readonly links: readonly LinkView[];
  readonly asks: readonly AskLinkView[];
  readonly acts: readonly ActView[];
  readonly foot: string;
  readonly follow: readonly string[];
  readonly folded: { readonly text: string; readonly tone: Tone };
}

export interface ViewContext {
  readonly you: PersonId;
  readonly now: Date;
  readonly examples: readonly string[];
}

const copy = askCopy;
const LIST_CAP = 5;
const FOLLOW_MAX = 3;

const blank = {
  heads: [],
  headsNote: null,
  segments: [],
  months: [],
  rowsHead: null,
  rows: [],
  net: null,
  billsHead: null,
  bills: [],
  billsCap: null,
  more: null,
  note: null,
  examples: [],
  links: [],
  asks: [],
  acts: [],
  follow: [],
} as const satisfies Partial<CardView>;

const abs = (amount: number): Cents => cents(Math.abs(amount));
const money = (amount: number, currency: CurrencyCode) => formatMoney(abs(amount), currency);
const signed = (amount: number, currency: CurrencyCode) => (amount === 0 ? money(0, currency) : `${amount > 0 ? "+" : "−"}${money(amount, currency)}`);
const first = (person: PersonView) => firstNameOf(person.displayName);

function namer(you: PersonId) {
  return {
    subject: (person: PersonView) => (person.id === you ? copy.you : first(person)),
    object: (person: PersonView) => (person.id === you ? copy.youLower : first(person)),
    possessive: (person: PersonView) => (person.id === you ? copy.your : copy.possessive(first(person))),
  };
}

const placeOf = (scope: Pick<AskScope, "groups" | "all">) => {
  const [only] = scope.groups;
  return scope.groups.length === 1 && only ? only.name : scope.all ? copy.allGroups : copy.places(scope.groups.map((group) => group.name));
};

const scopeLead = (scope: Pick<AskScope, "groups">): Lead => {
  const [only] = scope.groups;
  return scope.groups.length === 1 && only ? { kind: "group", group: only } : { kind: "sparkle" };
};

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

function billView(bill: AskBill, ctx: ViewContext, chip: "bucket" | "group", meta: string): BillView {
  return {
    key: bill.id,
    href: bill.href,
    title: bill.title,
    chip:
      chip === "group"
        ? { label: bill.group.name, tint: bill.group.tint }
        : bill.bucket
          ? { label: bucketLabel[bill.bucket], tint: bucketTint[bill.bucket] }
          : null,
    meta,
    total: money(bill.total, bill.currency),
    when: shortDay(dayDate(bill.day), ctx.now),
  };
}

function balanceView(card: BalanceCard, ctx: ViewContext): CardView {
  const names = namer(ctx.you);
  const other = first(card.other);
  const subject = names.subject(card.subject);
  const groupOf = (name: string) => card.lines.find((line) => line.group.name === name)?.group;

  const heads: HeadView[] =
    card.totals.length > 0
      ? card.totals.map((total) => ({
          caption:
            total.net > 0
              ? card.mine
                ? copy.balance.owesYou(other)
                : copy.balance.owes(other, subject)
              : card.mine
                ? copy.balance.youOwe(other)
                : copy.balance.owes(subject, other),
          amount: money(total.net, total.currency),
          tone: card.mine ? (total.net > 0 ? "in" : "out") : "plain",
          sub: copy.balance.inGroups(total.groups),
          word: false,
        }))
      : [
          {
            caption: copy.balance.square(subject, other),
            amount: copy.money.allSquare,
            tone: "plain",
            sub: card.lastPayment
              ? copy.balance.settledOn(inlineDay(new Date(card.lastPayment.at), ctx.now))
              : card.lines.length === 0
                ? copy.balance.noBills
                : copy.balance.nothingOwed,
            word: true,
          },
        ];

  const overall = card.overall ?? [];
  const elsewhere = overall.filter((entry) => !card.totals.some((total) => total.currency === entry.currency && total.net === entry.amount));
  const headsNote =
    card.totals.length > 1
      ? copy.notes.currencies
      : card.overall !== null && card.mine && (elsewhere.length > 0 || (overall.length === 0 && card.totals.length > 0))
        ? copy.notes.onlyHere(
            copy.places(card.lines.map((line) => line.group.name)),
            overall.length === 0
              ? copy.notes.squareElsewhere
              : overall
                  .map((entry) => (entry.amount > 0 ? copy.notes.stillOwes(other, money(entry.amount, entry.currency)) : copy.notes.stillOwe(other, money(entry.amount, entry.currency))))
                  .join(", "),
          )
        : null;

  const openRows: RowView[] = (card.open ?? []).map((line) => {
    const owedToSubject = line.bill.payer.id === card.subject.id;
    return {
      key: line.bill.id,
      lead: { kind: "bill" },
      title: line.bill.title,
      sub: copy.balance.paidShare(
        names.subject(line.bill.payer),
        money(line.bill.total, line.bill.currency),
        owedToSubject ? names.possessive(card.other) : names.possessive(card.subject),
        money(line.bill.share ?? 0, line.bill.currency),
      ),
      amount: money(line.left, line.bill.currency),
      tone: card.mine ? (owedToSubject ? "in" : "out") : "plain",
      run: "",
      href: line.bill.href,
    };
  });
  const groupRows: RowView[] = card.lines.map((line) => ({
    key: line.group.id,
    lead: { kind: "group", group: line.group },
    title: line.group.name,
    sub: line.titles.length > 0 ? copy.balance.titles(line.titles, Math.max(0, line.bills - line.titles.length)) : copy.balance.together(line.bills),
    amount: line.net === 0 ? copy.money.even : signed(line.net, line.currency),
    tone: line.net === 0 ? "muted" : card.mine ? (line.net > 0 ? "in" : "out") : "plain",
    run: "",
    href: routes.group(line.group.id),
  }));
  const paymentRow: RowView[] =
    card.totals.length === 0 && card.lastPayment
      ? [
          {
            key: "payment",
            lead: { kind: "payment" },
            title: copy.balance.paid(names.subject(card.lastPayment.from), names.object(card.lastPayment.to), money(card.lastPayment.amount, card.lastPayment.currency)),
            sub: capital(inlineDay(new Date(card.lastPayment.at), ctx.now)),
            amount: money(card.lastPayment.amount, card.lastPayment.currency),
            tone: "plain",
            run: "",
            href: routes.groupTab(card.lastPayment.group.id, "balances"),
          },
        ]
      : [];

  const owing = card.lines.find((line) => line.net < 0 && line.settleHref !== null);
  const single = card.lines.length === 1 ? card.lines[0] : undefined;
  const canAct = card.mine && card.subject.id === ctx.you;
  const links: LinkView[] =
    owing?.settleHref != null && !canAct
      ? [{ label: copy.balance.settle(money(owing.net, owing.currency), other), href: owing.settleHref, primary: false }]
      : single
        ? [{ label: copy.balance.open(single.group.name), href: routes.group(single.group.id), primary: false }]
        : [];
  const owedLines = card.lines.filter((line) => line.net > 0);
  const acts: ActView[] = canAct
    ? [
        ...(owing ? [{ label: copy.act.follow.settle(money(owing.net, owing.currency), other), icon: "arrow-right" as const, intent: { action: "recordPayment" as const, personId: card.other.id, groupId: owing.group.id } }] : []),
        ...(owedLines.length > 0
          ? [{ label: copy.act.follow.remind(other), icon: "bell" as const, intent: { action: "remindDebts" as const, personId: card.other.id, groupId: owedLines.length === 1 ? (owedLines[0]?.group.id ?? null) : null } }]
          : []),
      ]
    : [];

  const top = card.totals[0];
  const topGroup = top ? groupOf(top.groups[0] ?? "") : card.lines[0]?.group;
  const follow = card.mine
    ? [
        ...(top ? [top.net < 0 ? copy.balance.followWhyOwe(other, money(top.net, top.currency)) : copy.balance.followWhyOwed(other, money(top.net, top.currency))] : []),
        copy.suggest.paid(other),
        ...(topGroup ? [copy.suggest.cost(topGroup.name)] : []),
      ]
    : [];

  return {
    ...blank,
    eyebrow: { lead: { kind: "person", person: card.other }, text: card.mine ? copy.balance.eyebrow(card.other.displayName) : copy.balance.eyebrowOthers(subject, other) },
    heads,
    headsNote,
    rowsHead: openRows.length > 0 ? { left: copy.balance.addsUp, right: "" } : null,
    rows: openRows.length > 0 ? openRows : [...groupRows, ...paymentRow],
    links,
    acts,
    foot: copy.foot.from(card.source.bills, card.source.payments, card.source.groups.length > 0 ? card.source.groups : [copy.allGroups]),
    follow: follow.slice(0, FOLLOW_MAX),
    folded: top
      ? {
          text: card.totals
            .map((total) => (total.net > 0 ? copy.balance.folded.owesYou(other, money(total.net, total.currency)) : copy.balance.folded.youOwe(other, money(total.net, total.currency))))
            .join(" · "),
          tone: card.totals.length === 1 && card.mine ? (top.net > 0 ? "in" : "out") : "plain",
        }
      : { text: copy.balance.folded.square(other), tone: "plain" },
  };
}

function whyView(card: WhyCard, ctx: ViewContext): CardView {
  const names = namer(ctx.you);
  const other = first(card.other);
  const subject = names.subject(card.subject);
  const sign = card.net < 0 ? -1 : 1;
  const bills = card.entries.filter((entry) => entry.kind === "bill").length + (card.earlier?.count ?? 0);
  const tone: Tone = card.net === 0 ? "plain" : card.mine ? (card.net > 0 ? "in" : "out") : "plain";
  const netMoney = money(card.net, card.currency);

  const rows: RowView[] = [
    ...(card.earlier
      ? [
          {
            key: "earlier",
            lead: { kind: "bill" } as Lead,
            title: capital(copy.why.earlier(card.earlier.count)),
            sub: copy.why.earlierSub,
            amount: "",
            tone: "muted" as Tone,
            run: formatMoney(cents(card.earlier.running * sign), card.currency),
            href: null,
          },
        ]
      : []),
    ...card.entries.map((entry, index): RowView => {
      const delta = entry.delta * sign;
      const base = {
        amount: `${delta > 0 ? "+" : "−"}${money(delta, card.currency)}`,
        tone: (card.mine ? (entry.delta > 0 ? "in" : "out") : "plain") as Tone,
        run: formatMoney(cents(entry.running * sign), card.currency),
      };
      if (entry.kind === "payment") {
        return {
          ...base,
          key: `payment-${index}`,
          lead: { kind: "payment" },
          title: copy.balance.paid(names.subject(entry.payment.from), names.object(entry.payment.to), money(entry.payment.amount, entry.payment.currency)),
          sub: shortDay(new Date(entry.payment.at), ctx.now),
          href: routes.groupTab(card.group.id, "balances"),
        };
      }
      const owedToSubject = entry.delta > 0;
      return {
        ...base,
        key: entry.bill.id,
        lead: { kind: "bill" },
        title: entry.bill.title,
        sub: copy.balance.paidShare(
          names.subject(entry.bill.payer),
          money(entry.bill.total, entry.bill.currency),
          owedToSubject ? names.possessive(card.other) : names.possessive(card.subject),
          money(entry.bill.share ?? 0, entry.bill.currency),
        ),
        href: entry.bill.href,
      };
    }),
  ];

  const caption = card.net === 0 ? copy.balance.square(subject, other) : card.net > 0 ? (card.mine ? copy.balance.owesYou(other) : copy.balance.owes(other, subject)) : card.mine ? copy.balance.youOwe(other) : copy.balance.owes(subject, other);
  return {
    ...blank,
    eyebrow: {
      lead: { kind: "person", person: card.other },
      text: !card.mine ? copy.why.eyebrowOthers(subject, other, card.group.name) : card.net === 0 ? copy.why.eyebrowSquare(other, card.group.name) : copy.why.eyebrow(netMoney, other),
    },
    heads: [
      {
        caption,
        amount: card.net === 0 ? copy.money.allSquare : netMoney,
        tone,
        sub: copy.why.after(card.group.name, bills, card.source.payments),
        word: card.net === 0,
      },
    ],
    rowsHead: {
      left: copy.why.head,
      right: card.net === 0 ? copy.why.columnBalance : card.net < 0 ? (card.mine ? copy.why.columnYouOwe : copy.why.columnOwes(subject)) : copy.why.columnOwes(other),
    },
    rows,
    net: {
      label: card.net === 0 ? copy.why.soSquare : card.net < 0 ? (card.mine ? copy.why.soYouOwe(other) : copy.why.soOwes(subject, other)) : card.mine ? copy.why.soOwesYou(other) : copy.why.soOwes(other, subject),
      amount: card.net === 0 ? copy.money.allSquare : netMoney,
      tone,
    },
    links:
      card.settleHref !== null && card.net < 0
        ? [{ label: copy.balance.settle(netMoney, other), href: card.settleHref, primary: false }]
        : [{ label: copy.balance.open(card.group.name), href: routes.group(card.group.id), primary: false }],
    foot: copy.foot.from(card.source.bills, card.source.payments, [card.group.name]),
    follow: card.mine ? [copy.suggest.paid(other), copy.suggest.cost(card.group.name)] : [],
    folded: { text: `${caption}${card.net === 0 ? ` ${copy.money.allSquare.toLowerCase()}` : ` ${netMoney}`}`, tone },
  };
}

function spendView(card: SpendCard, ctx: ViewContext): CardView {
  const names = namer(ctx.you);
  const place = placeOf(card.scope);
  const bucket = card.scope.bucket ? bucketLabel[card.scope.bucket] : null;
  const period = periodLabel(card.scope.from, card.scope.to);
  const whose = card.whose;
  const withPeriod = (text: string) => (period ? `${text} ${period}` : text);
  const placeFor = (groups: readonly string[]) => capital(groups.length === 1 && groups[0] ? groups[0] : card.scope.all ? copy.yourGroups : copy.places(groups));

  const heads: HeadView[] = card.totals.map((total) => {
    const where = placeFor(total.groups);
    const caption =
      whose === null
        ? bucket
          ? copy.spend.bucketSpent(where, bucket.toLowerCase())
          : copy.spend.spent(where)
        : card.mine
          ? bucket
            ? copy.spend.bucketCostYou(bucket, where)
            : copy.spend.costYou(where)
          : bucket
            ? copy.spend.bucketCost(bucket, where, first(whose))
            : copy.spend.cost(where, first(whose));
    return {
      caption: withPeriod(caption),
      amount: money(total.amount, total.currency),
      tone: "plain",
      sub:
        whose === null
          ? copy.spend.yourShare(money(total.yourShare, total.currency), total.bills)
          : total.groupTotal !== total.amount
            ? copy.spend.shareOf(capital(names.possessive(whose)), money(total.groupTotal, total.currency), total.bills)
            : copy.spend.across(total.bills),
      word: false,
    };
  });

  const breakdown = card.breakdown;
  const segments: SegmentView[] =
    breakdown?.by === "bucket"
      ? breakdown.parts.map((part) => ({
          key: part.bucket,
          label: bucketLabel[part.bucket],
          amount: money(part.amount, breakdown.currency),
          weight: part.amount,
          tint: bucketTint[part.bucket],
        }))
      : [];
  const peak = breakdown?.by === "month" ? Math.max(1, ...breakdown.parts.map((part) => part.amount)) : 1;
  const months: MonthBar[] =
    breakdown?.by === "month"
      ? breakdown.parts.map((part) => ({
          key: part.month,
          label: monthLabel(part.month, true),
          amount: money(part.amount, breakdown.currency),
          height: part.amount / peak,
          on: part.on,
        }))
      : [];

  const shareOwner = whose ?? null;
  const bills = card.bills.map((bill) =>
    billView(
      bill,
      ctx,
      card.scope.groups.length === 1 || bucket === null ? "bucket" : "group",
      bill.share !== null
        ? copy.spend.paidShare(names.subject(bill.payer), shareOwner ? names.possessive(shareOwner) : copy.your, money(bill.share, bill.currency))
        : copy.spend.paidOnly(names.subject(bill.payer)),
    ),
  );
  const firstHead = heads[0];
  const single = card.scope.groups.length === 1;
  const follow = card.mine || whose === null
    ? [
        ...(card.scope.bucket === null ? [copy.spend.followFood] : [card.scope.bucket === "DRINKS" ? copy.spend.followFood : copy.spend.followDrinks, copy.spend.followEverything]),
        ...(breakdown?.by === "month" ? [] : [copy.spend.followMonth]),
        ...(card.scope.bucket === null ? [single ? copy.spend.followMost : copy.spend.followGroups] : []),
      ]
    : [];

  return {
    ...blank,
    eyebrow: {
      lead: scopeLead(card.scope),
      text: bucket ? copy.spend.eyebrowBucket(bucket, place) : whose === null ? copy.spend.eyebrowGroup(place) : card.mine ? copy.spend.eyebrowShare(place) : copy.spend.eyebrowTheirs(first(whose), place),
    },
    heads,
    headsNote: card.totals.length > 1 ? copy.notes.currencies : card.untagged > 0 && (bucket !== null || segments.length > 0) ? copy.notes.untagged(card.untagged) : null,
    segments,
    months,
    billsHead: bills.length === 0 ? null : segments.length > 0 && card.billCount > bills.length ? copy.spend.biggest : copy.spend.theBills,
    bills,
    more: card.moreHref ? { label: copy.spend.showAll(card.billCount), href: card.moreHref } : null,
    foot: bucket
      ? copy.foot.tagged(card.billCount, bucket, card.source.groups, period)
      : period
        ? copy.foot.period(card.billCount, card.source.groups, period)
        : copy.foot.from(card.billCount, 0, card.source.groups),
    follow: follow.slice(0, FOLLOW_MAX),
    folded: {
      text: heads.map((head) => copy.spend.folded(head.caption, head.amount)).join(" · ") || (firstHead?.caption ?? ""),
      tone: "plain",
    },
  };
}

function rankView(card: RankCard, ctx: ViewContext): CardView {
  const names = namer(ctx.you);
  const place = placeOf(card.scope);
  const bucket = card.scope.bucket ? bucketLabel[card.scope.bucket] : null;
  const top = card.rows[0];
  const mixed = new Set(card.rows.map((row) => row.currency)).size > 1;
  const subject = card.subject;

  const rows: RowView[] = card.rows.map((row, index) => {
    const lead: Lead = row.person ? { kind: "person", person: row.person } : row.group ? { kind: "group", group: row.group } : { kind: "sparkle" };
    const flows = card.metric !== "spend";
    return {
      key: `${row.person?.id ?? row.group?.id ?? index}-${row.currency}`,
      lead,
      title: row.person ? (row.person.id === ctx.you ? copy.you : row.person.displayName) : (row.group?.name ?? ""),
      sub:
        card.metric === "net"
          ? row.amount > 0
            ? copy.rank.isOwed
            : copy.rank.owesRow
          : card.metric === "balance"
            ? copy.rank.together(row.bills)
            : copy.rank.bills(row.bills),
      amount: flows ? signed(row.amount, row.currency) : money(row.amount, row.currency),
      tone: flows ? (row.amount > 0 ? "in" : "out") : "plain",
      run: "",
      href: row.href,
    };
  });

  const heads: HeadView[] =
    card.metric === "balance"
      ? card.totals.length > 0
        ? card.totals.map((total) => ({
            caption:
              total.amount > 0
                ? card.mine
                  ? copy.rank.owed
                  : copy.rank.owedOther(subject ? first(subject) : copy.someone)
                : card.mine
                  ? copy.rank.owe
                  : copy.rank.oweOther(subject ? first(subject) : copy.someone),
            amount: money(total.amount, total.currency),
            tone: total.amount > 0 ? "in" : "out",
            sub: copy.rank.people(card.rows.filter((row) => row.currency === total.currency).length),
            word: false,
          }))
        : [{ caption: copy.rank.squareAll, amount: copy.money.allSquare, tone: "plain", sub: capital(place), word: true }]
      : top
        ? [
            {
              caption:
                card.metric === "net"
                  ? copy.rank.topOwed(top.person ? names.subject(top.person) : "")
                  : top.person
                    ? top.person.id === ctx.you
                      ? copy.rank.topSpentYou
                      : copy.rank.topSpent(first(top.person))
                    : copy.rank.topGroup(top.group?.name ?? ""),
              amount: money(top.amount, top.currency),
              tone: "plain",
              sub: card.metric === "net" ? capital(place) : `${bucket ? `${bucket} · ` : ""}${copy.rank.bills(top.bills)}`,
              word: false,
            },
          ]
        : [{ caption: copy.rank.squareGroup, amount: copy.money.allSquare, tone: "plain", sub: capital(place), word: true }];

  const firstOther = card.rows.find((row) => row.person && row.person.id !== ctx.you)?.person;
  return {
    ...blank,
    eyebrow: {
      lead: card.metric === "balance" && subject ? { kind: "person", person: subject } : scopeLead(card.scope),
      text:
        card.metric === "balance"
          ? card.mine || !subject
            ? copy.rank.balanceYou
            : copy.rank.balanceOther(first(subject))
          : card.metric === "net"
            ? copy.rank.net(place)
            : card.by === "person"
              ? copy.rank.spendPerson(place)
              : copy.rank.spendGroup,
    },
    heads,
    headsNote: mixed ? copy.notes.currencies : null,
    rows,
    foot: copy.foot.from(card.source.bills, 0, card.source.groups.length > 0 ? card.source.groups : [copy.allGroups]),
    follow: [
      ...(firstOther ? [copy.rank.followWith(first(firstOther))] : []),
      ...(card.scope.groups.length === 1 && card.scope.groups[0] ? [copy.suggest.cost(card.scope.groups[0].name)] : []),
    ].slice(0, FOLLOW_MAX),
    folded: { text: heads.map((head) => `${head.caption} ${head.amount}`).join(" · "), tone: "plain" },
  };
}

function listView(card: ListCard, ctx: ViewContext): CardView {
  const names = namer(ctx.you);
  const { filter } = card;
  const place = placeOf(filter);
  const period = periodLabel(filter.from, filter.to);
  const base = filter.payer
    ? copy.list.paid(filter.payer.id === ctx.you ? copy.youLower : filter.payer.displayName)
    : filter.involving
      ? copy.list.withPerson(filter.involving.id === ctx.you ? copy.youLower : filter.involving.displayName)
      : filter.title
        ? copy.list.named(filter.title)
        : filter.bucket
          ? copy.list.bucket(bucketLabel[filter.bucket])
          : copy.list.plain;
  const text = `${filter.all ? base : copy.list.inPlace(base, place)}${period ? ` ${period}` : ""}`;
  const person = filter.payer ?? filter.involving;
  const several = card.totals.length > 1;
  return {
    ...blank,
    eyebrow: { lead: person ? { kind: "person", person } : scopeLead(filter), text },
    heads: card.totals.map((total) => ({
      caption: several ? copy.list.countIn(total.bills, total.currency) : copy.list.count(total.bills),
      amount: money(total.amount, total.currency),
      tone: "plain",
      sub: copy.balance.inGroups(total.groups),
      word: false,
    })),
    headsNote: several ? copy.list.twoTotals : null,
    bills: card.bills.map((bill) =>
      billView(
        bill,
        ctx,
        filter.groups.length === 1 ? "bucket" : "group",
        `${filter.payer ? "" : `${copy.spend.paidOnly(names.subject(bill.payer))} · `}${bill.share !== null && bill.share > 0 ? copy.list.yourShare(money(bill.share, bill.currency)) : copy.list.notIn}`,
      ),
    ),
    billsCap: LIST_CAP,
    foot: period ? copy.foot.period(card.billCount, card.source.groups, period) : copy.foot.from(card.billCount, 0, card.source.groups),
    follow: person && person.id !== ctx.you ? [copy.suggest.owe(first(person)), copy.suggest.square(first(person))] : [copy.suggest.everyone],
    folded: {
      text: copy.list.folded(
        card.billCount,
        card.totals.map((total) => money(total.amount, total.currency)),
      ),
      tone: "plain",
    },
  };
}

function activityView(card: ActivityCard, ctx: ViewContext): CardView {
  const items = card.events.map((event) => ({ item: { ...event.feed, at: new Date(event.feed.at) } as FeedItem, change: event.change }));
  const latest = items[0];
  const latestLine = latest ? feedLine(latest.item, ctx.you) : null;
  const groupName = card.group?.name ?? copy.allGroups;

  const head: HeadView | null = !latest || !latestLine
    ? null
    : latest.change && card.bill
      ? {
          caption: copy.activity.changed(latestLine.who, card.bill.title, inlineDay(latest.item.at, ctx.now)),
          amount: signed(latest.change.after - latest.change.before, latest.change.currency),
          tone: "plain",
          sub: copy.activity.wentFrom(money(latest.change.before, latest.change.currency), money(latest.change.after, latest.change.currency)),
          word: false,
        }
      : card.bill?.total
        ? {
            caption: copy.activity.totalNow(card.bill.title),
            amount: money(card.bill.total.amount, card.bill.total.currency),
            tone: "plain",
            sub: copy.activity.lastTouched(latestLine.who === copy.you ? copy.youLower : latestLine.who, inlineDay(latest.item.at, ctx.now)),
            word: false,
          }
        : {
            caption: capital(card.group ? card.group.name : copy.allGroups),
            amount: copy.activity.updates(items.length),
            tone: "plain",
            sub: copy.activity.latest(`${latestLine.who} ${latestLine.what}`),
            word: true,
          };

  const rows: RowView[] = items.map(({ item, change }) => {
    const line = feedLine(item, ctx.you);
    const when = momentLabel(item.at, ctx.now);
    return {
      key: item.id,
      lead: item.actor ? { kind: "person", person: item.actor } : { kind: "moment", moment: item.moment, tint: item.tint },
      title: `${line.who} ${line.what}`,
      sub: change ? `${copy.activity.fromTo(money(change.before, change.currency), money(change.after, change.currency))} · ${when}` : when,
      amount: change ? signed(change.after - change.before, change.currency) : item.amount ? money(item.amount.cents, item.amount.currency) : "",
      tone: "plain",
      run: "",
      href: item.href,
    };
  });

  return {
    ...blank,
    eyebrow: {
      lead: card.group ? { kind: "group", group: card.group } : { kind: "sparkle" },
      text: card.bill ? copy.activity.eyebrowBill(card.bill.title, groupName) : card.group ? copy.activity.eyebrowGroup(card.group.name) : copy.activity.eyebrowAll,
    },
    heads: head ? [head] : [],
    rowsHead: { left: copy.activity.newest, right: "" },
    rows,
    links: card.bill?.href ? [{ label: copy.activity.open(card.bill.title), href: card.bill.href, primary: false }] : [],
    foot: card.bill ? copy.foot.history(card.bill.title, groupName) : copy.foot.activity(groupName),
    follow: card.group ? [copy.suggest.cost(card.group.name), copy.suggest.everyone] : [copy.suggest.everyone],
    folded: { text: latestLine ? copy.activity.folded(latestLine.who, latestLine.what) : copy.activity.eyebrowAll, tone: "plain" },
  };
}

function emptyView(card: EmptyCard): CardView {
  const place = placeOf(card.scope);
  const bucket = card.scope.bucket ? bucketLabel[card.scope.bucket] : null;
  const period = periodLabel(card.scope.from, card.scope.to);
  const [only] = card.scope.groups;
  const single = card.scope.groups.length === 1 && only ? only : null;
  const note: NoteView =
    card.about === "spend"
      ? {
          icon: "memo",
          tint: "amber",
          title: copy.empty.spendTitle(bucket ? bucket.toLowerCase() : null, place),
          body:
            bucket && card.scope.bucket && card.checked > 0
              ? copy.empty.spendBucketBody(card.checked, place, bucket, copy.empty.hints[card.scope.bucket] ?? "")
              : copy.empty.spendBody(card.checked, period),
        }
      : card.about === "list"
        ? { icon: "memo", tint: "amber", title: copy.empty.listTitle, body: copy.empty.listBody(card.checked, place, period) }
        : card.about === "activity"
          ? { icon: "memo", tint: "amber", title: copy.empty.activityTitle(card.title), body: copy.empty.activityBody }
          : { icon: "check", tint: "green", title: copy.empty.balanceTitle(card.other ? first(card.other) : copy.someone), body: copy.empty.balanceBody(place) };
  return {
    ...blank,
    eyebrow: {
      lead: scopeLead(card.scope),
      text:
        card.about === "spend"
          ? copy.empty.eyebrowSpend(bucket, place)
          : card.about === "list"
            ? copy.empty.eyebrowList(place)
            : card.about === "activity"
              ? copy.empty.eyebrowActivity
              : copy.empty.eyebrowBalance(card.other ? first(card.other) : copy.someone),
    },
    note,
    asks:
      card.about === "spend" && card.scope.bucket !== null
        ? [card.scope.bucket === "FOOD" ? { label: copy.empty.showAll, question: copy.empty.askAll } : { label: copy.empty.showFood, question: copy.empty.askFood }]
        : [],
    links: single ? [{ label: copy.empty.open(single.name), href: routes.group(single.id), primary: false }] : [],
    foot: copy.foot.checked(card.checked, place),
    folded: { text: note.title, tone: "muted" },
  };
}

function declineView(card: DeclineCard, ctx: ViewContext): CardView {
  const sparkle: Lead = { kind: "sparkle" };
  if (card.reason === "outOfScope") {
    const text = copy.decline.scope;
    return {
      ...blank,
      eyebrow: { lead: sparkle, text: text.eyebrow },
      note: { icon: "sparkles", tint: "brand", title: text.title, body: text.body },
      examples: ctx.examples.slice(0, 3),
      foot: copy.foot.free,
      folded: { text: text.title, tone: "muted" },
    };
  }
  if (card.reason === "notYourGroup") {
    const text = copy.decline.private;
    const [example] = ctx.examples;
    return {
      ...blank,
      eyebrow: { lead: sparkle, text: text.eyebrow },
      note: { icon: "lock", tint: "neutral", title: text.title, body: text.body },
      asks: example ? [{ label: example, question: example }] : [],
      foot: copy.foot.free,
      folded: { text: text.title, tone: "muted" },
    };
  }
  const text = copy.decline.change;
  const name = card.person ? first(card.person) : null;
  return {
    ...blank,
    eyebrow: { lead: sparkle, text: text.eyebrow },
    note: { icon: "card", tint: "blue", title: text.title, body: name ? text.bodyPerson(name) : text.body },
    links: card.settleHref
      ? [{ label: text.settle, href: card.settleHref, primary: true }]
      : card.group
        ? [{ label: text.open(card.group.name), href: routes.group(card.group.id), primary: true }]
        : [{ label: text.addBill, href: routes.newBill, primary: true }],
    asks: name ? [{ label: text.ask(name), question: copy.suggest.owe(name) }] : [],
    foot: copy.foot.free,
    folded: { text: text.title, tone: "muted" },
  };
}

export function cardView(card: AskCard, ctx: ViewContext): CardView {
  switch (card.kind) {
    case "balance":
      return balanceView(card, ctx);
    case "why":
      return whyView(card, ctx);
    case "spend":
      return spendView(card, ctx);
    case "rank":
      return rankView(card, ctx);
    case "list":
      return listView(card, ctx);
    case "activity":
      return activityView(card, ctx);
    case "empty":
      return emptyView(card);
    case "decline":
      return declineView(card, ctx);
  }
}

export const isFree = (card: AskCard) => card.kind === "decline";
