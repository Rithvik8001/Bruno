import { billFieldWords } from "@/lib/bills/messages";
import type { BillChangeField } from "@/lib/bills/diff";
import type { PersonBillStatus } from "@/lib/ledger/allocation";
import type { Tint } from "@/lib/design-system/tokens";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const personStatusTint = {
  payer: "neutral",
  paid: "green",
  owes: "orange",
  out: "muted",
} as const satisfies Record<PersonBillStatus, Tint>;

export const billDetailCopy = {
  metaTitle: "Bill",
  you: "You",
  actions: {
    share: "Share summary",
    shared: "Summary copied",
    shareFailed: "Couldn't copy. Try again.",
    edit: "Edit bill",
    more: "More options",
    menuBody: "Changes update everyone's balances straight away.",
    changeSplit: "Change the split",
    delete: "Delete bill",
    cancel: "Cancel",
  },
  deleteSheet: {
    title: "Delete this bill?",
    body: "It drops out of everyone's balances. The group keeps a note that it was deleted.",
    confirm: "Delete bill",
    cancel: "Keep it",
    done: (title: string) => `${title} deleted`,
  },
  meta: (day: string, payer: string) => `${day} · paid by ${payer}`,
  status: {
    open: (n: number, payer: string) => `Open · ${n} owe${n === 1 ? "s" : ""} ${payer}`,
    overdue: (n: number, payer: string) => `Overdue · ${n} owe${n === 1 ? "s" : ""} ${payer}`,
    settled: "Settled",
  },
  people: {
    title: "Who owes what",
    status: {
      payer: "Paid the bill",
      paid: "Paid",
      owes: (payer: string) => (payer === "you" ? "Owes you" : `Owes ${payer}`),
      out: "Not in",
    },
    notInSplit: "Not in the split",
    expand: (name: string) => `How ${name === "You" ? "your" : `${name}'s`} share was worked out`,
  },
  basis: {
    half: (name: string) => `half the ${name}`,
    split: (name: string, ways: number) => `${name} (split ${ways} ways)`,
    even: (ways: number) => `Even split · 1 of ${ways}`,
    shares: (shares: number, of: number) => `${plural(shares, "share", "shares")} of ${of}`,
    percent: (pct: string) => `${pct}% of the bill`,
    amount: "Fixed amount",
  },
  explain: {
    mine: (name: string) => (name === "You" ? "all yours" : "all theirs"),
    shared: (names: string) => `shared with ${names}`,
    items: "Items",
    discount: "Discount",
    extras: (pct: string) => `Tax and tip · ${pct}% of items`,
    extrasFlat: "Tax and tip",
    owes: (name: string, payer: string) => `${name} ${name === "You" ? "owe" : "owes"} ${payer}`,
    share: (name: string) => (name === "You" ? "Your share" : `${name}'s share`),
  },
  receipt: {
    items: "Items",
    claimedBy: "Claimed by",
    method: { ITEMS: "Claimed by", EVEN: "Split evenly", SHARES: "Split by shares", PERCENT: "Split by percent", AMOUNT: "Fixed amounts" },
    each: (amount: string) => `${amount} each`,
    subtotal: "Items",
    discount: "Discount",
    tax: "Tax",
    tip: "Tip",
    tipPct: (pct: string) => `Tip · ${pct}%`,
    total: "Total",
  },
  activity: {
    title: "On this bill",
    created: (items: number) => `added the bill · ${plural(items, "item", "items")}`,
    updated: (fields: readonly BillChangeField[]) => `changed the ${fields.map((f) => billFieldWords[f]).join(", ")}`,
    someone: "Someone",
  },
  settle: {
    with: (name: string) => `Settle with ${name}`,
    payBack: (name: string) => `Pay ${name} back`,
  },
  summary: {
    head: (title: string, group: string, total: string) => `${title} · ${group} · ${total}`,
    paidBy: (payer: string) => `Paid by ${payer}`,
    line: (name: string, amount: string, status: string) => `${name}: ${amount} (${status})`,
  },
} as const;

