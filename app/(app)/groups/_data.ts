import { currencies, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import type { GroupArtId } from "@/lib/design-system/icons3d";
import type { PaletteTint } from "@/lib/design-system/tokens";

export interface GroupFormValue {
  readonly name: string;
  readonly tint: PaletteTint;
  readonly art: GroupArtId | null;
  readonly currency: CurrencyCode;
}

export const emptyGroupForm: GroupFormValue = { name: "", tint: "indigo", art: null, currency: "USD" };

const currencyNames = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  CAD: "Canadian dollar",
  AUD: "Australian dollar",
  INR: "Indian rupee",
  CHF: "Swiss franc",
  MXN: "Mexican peso",
  JPY: "Japanese yen",
  KRW: "South Korean won",
} as const satisfies Record<CurrencyCode, string>;

export const currencyOptions = CURRENCY_CODES.map((code) => ({
  value: code,
  label: `${currencyNames[code]} · ${currencies[code].symbol}`,
}));

export const groupFormCopy = {
  name: { label: "Group name", placeholder: "e.g. Lisbon trip" },
  icon: { label: "Icon", auto: "Auto from name", picked: "Picked" },
  colour: { label: "Colour" },
  currency: { label: "Default currency", locked: "Locked once the group has bills." },
} as const;

export const groupsCopy = {
  metaTitle: "Groups",
  title: "Groups",
  newGroup: "New group",
  empty: {
    title: "No groups yet",
    body: "A group keeps a running tab for the people you split with most.",
    cta: "Create your first group",
  },
  card: {
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    openBills: (n: number) => `${n} open ${n === 1 ? "bill" : "bills"}`,
    settled: "Settled",
    owedToYou: "owed to you",
    youOwe: "you owe",
    allSquare: "all square",
  },
  sheet: {
    title: "New group",
    description: "Name it, pick an icon and colour, invite people after.",
    create: (name: string) => (name ? `Create “${name}”` : "Create group"),
    cancel: "Cancel",
  },
} as const;
