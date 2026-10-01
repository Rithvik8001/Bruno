import type { PaymentMethod } from "@/lib/ledger/rules";

export const paymentMethodLabels = {
  VENMO: "Venmo",
  CASH: "Cash",
  PAYPAL: "PayPal",
  BANK: "Bank",
  OTHER: "Other",
} as const satisfies Record<PaymentMethod, string>;

export const settlementMessages = {
  notMember: "You’re not in this group any more. Ask a member for the invite link.",
  unknownPerson: "They’re not part of this group. Pick someone from the group.",
  samePerson: "You can’t settle with yourself.",
  nothingOwed: "There’s nothing to settle between you two.",
  tooMuch: (max: string) => `That’s more than what’s owed. The most is ${max}.`,
  amountMissing: "Enter an amount.",
  noteTooLong: (max: number) => `Keep the note under ${max} characters.`,
  gone: "This payment doesn’t exist any more. Reload to see the latest.",
  cantConfirm: "This payment can’t be confirmed any more. Reload to see where it stands.",
  cantDecline: "This payment can’t be declined any more. Reload to see where it stands.",
  cantUndo: "It’s too late to undo this payment. Record a payment the other way instead.",
} as const;
