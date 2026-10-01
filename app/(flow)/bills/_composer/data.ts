import type { SplitMethod } from "@/lib/bills/types";
import type { PaletteTint } from "@/lib/design-system/tokens";

export type SplitTab = Exclude<SplitMethod, "ITEMS">;

export const SPLIT_TABS = ["EVEN", "SHARES", "PERCENT", "AMOUNT"] as const satisfies readonly SplitTab[];

export const TIP_PRESETS = [15, 18, 20] as const;

export const SHARES_RANGE = { min: 1, max: 9 } as const;

export type CheckTone = "ok" | "pending" | "reading" | "neutral";

export const checkTint = {
  ok: "green",
  pending: "amber",
  reading: "orange",
  neutral: "neutral",
} as const satisfies Record<CheckTone, PaletteTint | "neutral">;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const FLOW_MODES = ["create", "scan", "tell", "edit"] as const;
export type FlowModeKind = (typeof FLOW_MODES)[number];

export const flowModeCopy = {
  create: {
    back: "Back",
    itemsTitle: "Type the bill in",
    itemsBody: "Just the items and prices. Tax and tip go below.",
    finish: "Finish bill",
    save: "Save split",
    saved: (title: string, total: string) => `${title} added · ${total}`,
  },
  scan: {
    back: "Back",
    itemsTitle: "Check what Bruno read",
    itemsBody: "Fix anything off. Tap a flagged price to pick the right one.",
    finish: "Finish bill",
    save: "Save split",
    saved: (title: string, total: string) => `${title} added · ${total}`,
  },
  tell: {
    back: "Back",
    itemsTitle: "Check Bruno’s draft",
    itemsBody: "Bruno filled it in from what you said. Anything it guessed is marked.",
    finish: "Finish bill",
    save: "Save split",
    saved: (title: string, total: string) => `${title} added · ${total}`,
  },
  edit: {
    back: "Bill",
    itemsTitle: "Edit the bill",
    itemsBody: "Fix items, prices or who paid. Balances update when you save.",
    finish: "Save changes",
    save: "Save changes",
    saved: (title: string, total: string) => `${title} updated · ${total}`,
  },
} as const satisfies Record<FlowModeKind, Record<string, string | ((title: string, total: string) => string)>>;

export const claimingEditCopy = {
  back: "Claiming",
  itemsTitle: "Edit the items",
  itemsBody: "Claims on items you keep stay put. Everyone sees changes straight away.",
  saved: (title: string) => `${title} updated. Back to claiming.`,
  live: (title: string) => `${title} is open. Send the link round.`,
} as const;

export const composerCopy = {
  items: {
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
    status: {
      ready: "Ready",
      draft: "Draft",
      reading: "Reading",
      toCheck: (n: number) => `${n} to check`,
      guesses: (n: number) => `${plural(n, "guess", "guesses")} to check`,
    },
    check: {
      ok: "Looks good. Split when you’re ready.",
      noItems: "Add at least one priced item.",
      noTitle: "Say where this was.",
      unnamed: (n: number) => `Name ${n === 1 ? "the item" : `${n} items`} with a price.`,
      discount: "The discount is more than the items.",
      printing: "Still reading — totals will check once every line is in.",
      receiptMatch: (total: string) => `Adds up to ${total}, same as the receipt.`,
      receiptUnresolved: (printed: string, n: number) => `Receipt says ${printed}. Resolve ${n} flagged ${n === 1 ? "price" : "prices"} to match.`,
      receiptOff: (total: string, printed: string, diff: string) => `Adds up to ${total}, receipt says ${printed}. Off by ${diff}.`,
      unresolved: (n: number) => `Pick a price for ${n} flagged ${n === 1 ? "item" : "items"}.`,
      saidMatch: (total: string) => `Adds up to ${total}, same as you said.`,
      saidOff: (total: string, said: string, diff: string) => `Adds up to ${total}, you said ${said}. Off by ${diff}.`,
      saidUnpriced: (n: number) => `Add a price for ${n === 1 ? "the marked item" : `${n} marked items`}.`,
    },
    told: {
      label: "You said",
      show: "Show what you said",
      redraft: "Edit and redraft",
      redraftNote: "Redrafting replaces this draft.",
      unpriced: "No price yet. Type what it cost.",
      rest: (stated: string) => `The rest of the ${stated}`,
      payerGuess: "Bruno guessed you paid. Pick someone else if not.",
      payerKeep: "Yes, I paid",
      single: "One line for the whole bill. Add items if people should claim different things.",
    },
    guessPrompt: "Hard to read — was it",
    orType: "or type it.",
    categoryLabel: (name: string) => `Category for ${name || "item"}`,
    duplicate: {
      title: (day: string, place: string) => `Looks like ${day}'s ${place} receipt.`,
      body: "Same place, same total.",
      view: "View it",
      keep: "Keep both",
    },
    currencyMismatch: (group: string, currency: string) =>
      `Bruno read this in a different currency, but ${group} uses ${currency}. Check the amounts.`,
    footer: (items: number, group: string) => `${plural(items, "item", "items")} · ${group}`,
    cta: "Split it",
    claimingCta: "Save and back to claiming",
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
    unclaimedBody: "Keep assigning, or split what’s left between everyone.",
    splitRest: "Split the rest",
    editor: { title: "Need percentages or fixed amounts?", body: "Open the split editor." },
    live: { title: "Let everyone claim", body: "Send a link and they tap their own items.", saving: "Saving the bill…" },
    shareLabel: (name: string) => (name === "You" ? "Your share" : `${name}'s share`),
    assumed: "Bruno assumed everyone was in on this.",
    assumedKeep: "Looks right",
    status: { ready: "Ready", progress: (done: number, all: number) => `${done} of ${all} claimed` },
  },
  split: {
    back: "Who had what",
    title: "Split the bill",
    body: (total: string, place: string) => `${total} at ${place}, including tax and tip. Pick how, then nudge anyone’s share.`,
    methodsLabel: "Split method",
    methods: { EVEN: "Evenly", SHARES: "Shares", PERCENT: "Percent", AMOUNT: "Amount" },
    hints: {
      EVEN: "Everyone in the split pays the same. Tap an avatar to leave someone out.",
      SHARES: "Weight people — 2 shares pays twice as much as 1. Good for couples or big eaters.",
      PERCENT: "Percentages must add up to 100. Bruno tells you what’s left.",
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
      ok: (people: number, total: string) => `Everything’s assigned. ${plural(people, "person", "people")}, ${total}.`,
      nobody: "Tap an avatar to add someone to the split.",
      percentLeft: (sum: number, left: number) => `Percentages add up to ${sum}%. ${left}% still unassigned.`,
      percentOver: (sum: number, over: number) => `Percentages add up to ${sum}%. ${over}% too much.`,
      amountLeft: (amount: string) => `${amount} still unassigned.`,
      amountOver: (amount: string) => `${amount} more than the bill.`,
    },
    fix: { AMOUNT: "Give the rest to me", PERCENT: "Fill to 100%" },
    assigned: "Assigned",
    of: (total: string) => `of ${total}`,
  },
  today: "Today",
} as const;
