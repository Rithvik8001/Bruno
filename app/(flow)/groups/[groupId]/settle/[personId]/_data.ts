import { CASH_PAYMENT_LABEL } from "@/lib/settlements/messages";
import type { PaletteTint } from "@/lib/design-system/tokens";

export const SETTLE_STATUSES = ["open", "partial", "settled", "awaiting"] as const;
export type SettleStatus = (typeof SETTLE_STATUSES)[number];

export const settleStatusTint = {
  open: "orange",
  partial: "amber",
  settled: "green",
  awaiting: "blue",
} as const satisfies Record<SettleStatus, PaletteTint>;

export const settleCopy = {
  metaTitle: "Settle up",
  back: { home: "Home", bill: "Bill", group: "Group", ask: "Ask Bruno" },
  status: { open: "Open", partial: "Partial", settled: "Settled", awaiting: "Awaiting confirmation" },
  payLine: { toYou: (name: string) => `${name} pays you`, fromYou: (name: string) => `You pay ${name}` },
  breakdownMore: (n: number) => `+ ${n} more`,
  amount: "Amount",
  partial: (left: string) => `Partial · ${left} left`,
  over: (max: string) => `Most is ${max}`,
  cashPayment: "Record a cash payment",
  note: { label: "Note (optional)", placeholder: "e.g. Lupa + taxi" },
  recipient: {
    title: (name: string) => `Settle with ${name}`,
    body: (name: string) => `Record what ${name} paid you. Nothing moves through Bruno.`,
    cta: (amount: string) => `Mark ${amount} as paid`,
    fine: "You can undo for 24 hours.",
    doneFull: (name: string) => `Settled with ${name}`,
    donePartial: (amount: string, name: string) => `Recorded ${amount} from ${name}`,
    toastFull: (name: string) => `You and ${name} are all square.`,
    toastPartial: (name: string) => `Logged. ${name}'s getting there.`,
  },
  payer: {
    title: (name: string) => `Pay ${name} back`,
    body: "Send it the way you usually do, then mark it here. Bruno only keeps the record.",
    cta: (amount: string) => `I’ve paid ${amount}`,
    fine: (name: string) => `${name} confirms it here. The balance clears when they do, or in 3 days automatically.`,
    done: "Marked as paid",
    doneSub: (name: string) => `${CASH_PAYMENT_LABEL} · waiting for ${name}`,
    toast: (name: string) => `Logged. ${name} just needs to confirm.`,
  },
  confirm: {
    title: (name: string) => `${name} says they paid you`,
    body: (name: string) => `Confirm it landed and the balance clears. If it didn’t, say so and ${name} will see it’s still open.`,
    cta: (amount: string) => `Yes, I got ${amount}`,
    decline: "Didn’t get it",
    fine: (day: string) => `Confirms itself ${day} if you do nothing.`,
    done: (name: string) => `Settled with ${name}`,
    declined: "Marked as not received",
    declinedSub: (name: string) => `${name} will see it’s still open.`,
    toast: (name: string) => `You and ${name} are square on this one.`,
    toastDeclined: (name: string) => `Got it. ${name} will see it didn’t land.`,
  },
  awaiting: {
    title: (name: string) => `Waiting for ${name}`,
    body: (amount: string) => `You recorded a ${amount} cash payment.`,
    note: (name: string) => `Waiting for ${name} to confirm. The balance updates the moment they do, or in 3 days automatically.`,
    mistake: "Marked it by mistake?",
  },
  square: {
    title: (name: string) => `All square with ${name}`,
    body: "Nothing to settle between you two right now.",
    recent: (amount: string) => `You recorded a ${amount} cash payment.`,
  },
  doneSub: (left: string | null) => (left ? `${CASH_PAYMENT_LABEL} · just now · ${left} still open` : `${CASH_PAYMENT_LABEL} · just now`),
  undo: "Undo",
  undone: "Undone. The payment is back to unpaid.",
  backTo: { home: "Back to home", bill: "Back to the bill", group: "Back to the group", ask: "Back to Ask Bruno" },
} as const;
