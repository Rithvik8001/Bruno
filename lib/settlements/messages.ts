import type { PaymentMethod } from "@/lib/ledger/rules";

export const paymentMethodLabels = {
  VENMO: "Venmo",
  CASH: "Cash",
  PAYPAL: "PayPal",
  BANK: "Bank",
  OTHER: "Other",
} as const satisfies Record<PaymentMethod, string>;

export const settlementMessages = {
  notMember: "You're not in this group any more.",
  unknownPerson: "They're not part of this group.",
  samePerson: "You can't settle with yourself.",
  nothingOwed: "There's nothing to settle between you two.",
  tooMuch: (max: string) => `That's more than what's owed. The most is ${max}.`,
  amountMissing: "Enter an amount.",
  noteTooLong: (max: number) => `Keep the note under ${max} characters.`,
  gone: "This payment doesn't exist any more.",
  cantConfirm: "This payment can't be confirmed any more.",
  cantDecline: "This payment can't be declined any more.",
  cantUndo: "It's too late to undo this payment.",
} as const;
