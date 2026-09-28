import type { BuddyShape } from "@/lib/design-system/buddies";
import type { BillStatus } from "@/lib/design-system/semantics";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { cents, type Cents } from "@/lib/money";

export const HOME_PREVIEWS = ["empty", "loading"] as const;
export type HomePreview = (typeof HOME_PREVIEWS)[number];

export interface HomePerson {
  readonly id: string;
  readonly name: string;
  readonly tint: PaletteTint;
  readonly buddy?: BuddyShape;
  readonly caption: string;
  readonly balance: Cents;
}

export interface HomeBill {
  readonly id: string;
  readonly name: string;
  readonly group: { readonly name: string; readonly tint: PaletteTint };
  readonly status: Extract<BillStatus, "claiming" | "ready">;
  readonly meta: string;
  readonly total: Cents;
  readonly when: string;
}

export interface NextUp {
  readonly personId: string;
  readonly subject: string;
  readonly age: string;
}

export const mockPeople: readonly HomePerson[] = [
  { id: "sam", name: "Sam Okafor", tint: "pink", caption: "owes you · Lupa, taxi", balance: cents(5240) },
  { id: "ana", name: "Ana Lima", tint: "amber", caption: "owes you · Lisbon trip", balance: cents(3990) },
  { id: "priya", name: "Priya Raman", tint: "blue", caption: "you owe · groceries", balance: cents(-810) },
  { id: "jonas", name: "Jonas Keller", tint: "violet", caption: "settled on Sunday", balance: cents(0) },
];

export const mockBills: readonly HomeBill[] = [
  {
    id: "lupa",
    name: "Lupa",
    group: { name: "Friends", tint: "pink" },
    status: "claiming",
    meta: "3 of 5 claimed",
    total: cents(7600),
    when: "Tonight",
  },
  {
    id: "pasteis",
    name: "Pastéis de Belém",
    group: { name: "Lisbon trip", tint: "indigo" },
    status: "ready",
    meta: "everyone claimed · settle up",
    total: cents(2005),
    when: "Tue",
  },
];

export const mockNextUp: NextUp = { personId: "sam", subject: "Lupa and the taxi", age: "3 days old" };

export const homeCopy = {
  metaTitle: "Home",
  headline: { owed: "You're owed", owes: "You owe", settled: "All square", empty: "Welcome to Bruno." },
  fallbackGreeting: (firstName: string) => `Hi, ${firstName}`,
  greetings: {
    late: "Up late",
    morning: "Morning",
    friday: "Happy Friday",
    afternoon: "Afternoon",
    evening: "Evening",
  },
  people: {
    title: "People",
    owesYou: (n: number) => `${n} owe${n === 1 ? "s" : ""} you`,
    youOwe: (n: number) => `${n} you owe`,
    allSquare: "All square",
  },
  bills: { title: "Open bills", allActivity: "All activity" },
  nextUp: {
    owesYou: (first: string, amount: string) => `${first} owes you ${amount}`,
    nudged: (count: number) => `nudged ${count}×`,
    labels: ["Remind", "Nudge again", "Final nudge", "Nudged"],
    toasts: [
      (first: string) => `Sent ${first} a polite nudge.`,
      (first: string) => `${first}'s been nudged. Firmly this time.`,
      (first: string) => `Dramatic nudge sent. ${first} will feel it.`,
    ],
    enough: (first: string) => `Three's plenty. Give ${first} a day.`,
    undo: "Undo",
  },
  empty: {
    title: "Nothing owed, nothing owing.",
    body: "Add your first bill and Bruno will keep the score from here.",
    upload: "Upload a receipt",
    group: "Start a group",
  },
  breakdown: {
    owed: (first: string, amount: string) => `${first} ${amount}`,
    owes: (first: string, amount: string) => `minus ${amount} to ${first}`,
  },
} as const;
