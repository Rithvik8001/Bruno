import type { SplitMethod } from "@/lib/bills/types";
import type { PaletteTint } from "@/lib/design-system/tokens";

export type SplitTab = Exclude<SplitMethod, "ITEMS">;

export const SPLIT_TABS = ["EVEN", "SHARES", "PERCENT", "AMOUNT"] as const satisfies readonly SplitTab[];

export const TIP_PRESETS = [15, 18, 20] as const;

export const SHARES_RANGE = { min: 1, max: 9 } as const;

export type CheckTone = "ok" | "pending" | "neutral";

export const checkTint = {
  ok: "green",
  pending: "amber",
  neutral: "neutral",
} as const satisfies Record<CheckTone, PaletteTint | "neutral">;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const newBillCopy = {
  metaTitle: "Add a bill",
  entry: {
    back: "Home",
    title: "Add a bill",
    body: "Type it in and Bruno does the maths. Receipt scanning is on its way.",
    forLabel: "For",
    groupsLabel: "Which group is this for?",
    typeItIn: { title: "Type it in", body: "Add items by hand. Unlimited, always." },
    empty: {
      message: "Bills live in a group. Start one, invite the people you split with, then add the bill.",
      cta: "Start a group",
    },
  },
  items: {
    back: "Back",
    title: "Type the bill in",
    body: "Just the items and prices. Tax and tip go below.",
    place: { label: "Place", placeholder: "Where was this?" },
    date: { label: "Date" },
    payer: { label: "Paid by", you: (name: string) => `${name} (you)` },
    columns: { item: "Item", qty: "Qty", price: "Price" },
    itemName: "Item name",
    itemPlaceholder: "What was it?",
    quantity: "Quantity",
    price: "Price",
    remove: (name: string) => `Remove ${name || "item"}`,
    removed: (name: string) => `${name || "Item"} removed.`,
    undo: "Undo",
    addItem: "Add an item",
    subtotal: "Items",
    tax: "Tax",
    tip: "Tip",
    tipPresets: "Tip percentage",
    discount: "Discount",
    total: "Total",
    noTotal: "—",
    status: { ready: "Ready", draft: "Draft" },
    check: {
      ok: "Looks good. Split when you're ready.",
      noItems: "Add at least one priced item.",
      noTitle: "Say where this was.",
      unnamed: (n: number) => `Name ${n === 1 ? "the item" : `${n} items`} with a price.`,
      discount: "The discount is more than the items.",
    },
    footer: (items: number, group: string) => `${plural(items, "item", "items")} · ${group}`,
    cta: "Split it",
  },
  claim: {
    back: "Items",
    title: "Who had what?",
    body: "Pick someone, then tap what they had. Shared items split automatically.",
    assigning: "Assigning for",
    you: "You",
    paidBy: (when: string, payer: string) => `${when} · paid by ${payer}`,
    tapHint: (name: string) => (name === "You" ? "Tap if this was yours" : `Tap if ${name} had this`),
    each: (amount: string) => `${amount} each`,
    extras: (discounted: boolean) => (discounted ? "Tax, tip and discount" : "Tax and tip"),
    extrasShare: (name: string) => `${name === "You" ? "Your" : `${name}'s`} share of it`,
    unclaimed: (n: number, total: string) => `${n} unclaimed · ${total}`,
    unclaimedBody: "Keep assigning, or split what's left between everyone.",
    splitRest: "Split the rest",
    editor: { title: "Need percentages or fixed amounts?", body: "Open the split editor." },
    shareLabel: (name: string) => (name === "You" ? "Your share" : `${name}'s share`),
    status: { ready: "Ready", progress: (done: number, all: number) => `${done} of ${all} claimed` },
    cta: "Finish bill",
  },
  split: {
    back: "Who had what",
    title: "Split the bill",
    body: (total: string, place: string) => `${total} at ${place}, including tax and tip. Pick how, then nudge anyone's share.`,
    methodsLabel: "Split method",
    methods: { EVEN: "Evenly", SHARES: "Shares", PERCENT: "Percent", AMOUNT: "Amount" },
    hints: {
      EVEN: "Everyone in the split pays the same. Tap an avatar to leave someone out.",
      SHARES: "Weight people — 2 shares pays twice as much as 1. Good for couples or big eaters.",
      PERCENT: "Percentages must add up to 100. Bruno tells you what's left.",
      AMOUNT: "Type exact amounts. The remainder shows below until it hits zero.",
    },
    toggle: (name: string) => `Include ${name}`,
    out: "Not in this split",
    inCaption: { payer: "Paid the bill", member: "In the split" },
    shares: (name: string) => `Shares for ${name}`,
    percent: (name: string) => `Percent for ${name}`,
    amount: (name: string) => `Amount for ${name}`,
    empty: "—",
    status: {
      ok: "Adds up",
      percent: (pct: number) => `${pct}% assigned`,
      left: (amount: string) => `${amount} left`,
      over: (amount: string) => `${amount} over`,
      nobody: "No one in",
    },
    check: {
      ok: (people: number, total: string) => `Everything's assigned. ${plural(people, "person", "people")}, ${total}.`,
      nobody: "Tap an avatar to add someone to the split.",
      percentLeft: (sum: number, left: number) => `Percentages add up to ${sum}%. ${left}% still unassigned.`,
      percentOver: (sum: number, over: number) => `Percentages add up to ${sum}%. ${over}% too much.`,
      amountLeft: (amount: string) => `${amount} still unassigned.`,
      amountOver: (amount: string) => `${amount} more than the bill.`,
    },
    fix: { AMOUNT: "Give the rest to me", PERCENT: "Fill to 100%" },
    assigned: "Assigned",
    of: (total: string) => `of ${total}`,
    cta: "Save split",
  },
  today: "Today",
  saved: (title: string, total: string) => `${title} added · ${total}`,
} as const;
