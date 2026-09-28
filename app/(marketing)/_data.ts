import type { IconName } from "@/components/icons/icon";
import type { StackPerson } from "@/components/ui/avatar";
import type { BalanceDirection } from "@/lib/design-system/semantics";
import type { PaletteTint } from "@/lib/design-system/tokens";
import { cents, type Cents } from "@/lib/money";

export const routes = {
  home: "#top",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;

export const SECTION_IDS = {
  how: "how",
  pricing: "pricing",
  faq: "faq",
} as const;

export interface NavLink {
  readonly href: `#${string}`;
  readonly label: string;
}

export const navLinks: readonly NavLink[] = [
  { href: `#${SECTION_IDS.how}`, label: "How it works" },
  { href: `#${SECTION_IDS.pricing}`, label: "Pricing" },
  { href: `#${SECTION_IDS.faq}`, label: "Questions" },
];

export const people = {
  you: { id: "you", name: "You", initials: "You", tint: "brand" },
  sam: { id: "sam", name: "Sam", initials: "S", tint: "pink" },
  priya: { id: "priya", name: "Priya", initials: "PR", tint: "blue" },
  ana: { id: "ana", name: "Ana Lima", initials: "AL", tint: "amber" },
  jk: { id: "jk", name: "Jordan Kim", initials: "JK", tint: "violet" },
} as const satisfies Record<string, StackPerson>;

export type PersonId = keyof typeof people;

export interface BillLine {
  readonly name: string;
  readonly price: Cents;
  readonly by: readonly PersonId[];
}

export const lupaLines: readonly BillLine[] = [
  { name: "Burrata", price: cents(1400), by: ["sam"] },
  { name: "Rigatoni", price: cents(1900), by: ["priya"] },
  { name: "Negroni ×2", price: cents(2800), by: ["you", "sam"] },
  { name: "Tiramisu", price: cents(900), by: ["you"] },
  { name: "Sparkling water", price: cents(600), by: ["priya"] },
];

export const heroDiners: readonly PersonId[] = ["you", "sam", "priya"];

export const CLAIM_PREVIEW_COUNT = 3;

export interface StoryContent {
  readonly label: string;
  readonly tint: PaletteTint;
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
  readonly features: readonly string[];
}

export const stories = {
  upload: {
    label: "Upload",
    tint: "orange",
    icon: "receipt",
    title: "Upload the receipt. AI reads it.",
    body: "Every line, quantity and price, printed back to you in a second or two. Fix anything it got wrong with a tap, or skip the upload and type the bill in yourself.",
    features: ["AI receipt scanning", "Review and edit items", "Manual entry", "Add tips and discounts"],
  },
  claim: {
    label: "Claim",
    tint: "blue",
    icon: "users",
    title: "Send one link. Everyone taps what they had.",
    body: "No app, no account. Shared dishes split automatically between whoever claims them. You watch it fill in live, and whatever's left you can split evenly with one tap.",
    features: ["Invite by link", "Assign items", "Split evenly", "By percentage or fixed amount"],
  },
  balance: {
    label: "Balance",
    tint: "green",
    icon: "wallet",
    title: "Who owes whom, as one number each.",
    body: "Ten dinners, two taxis and a flat's worth of groceries collapse into the smallest set of payments. You see what you're owed, what you owe, and the one thing to do next.",
    features: ["Group balances", "Smart settlements", "Share a split summary", "Email notifications"],
  },
  notices: {
    label: "Notices",
    tint: "violet",
    icon: "alert",
    title: "Bruno notices what you'd miss.",
    body: "A blurry price gets flagged, not guessed. A receipt you already added gets caught before it double-charges anyone. Items get sorted, splits follow what your group usually does, and every balance can explain itself.",
    features: [
      "Flag uncertain items",
      "Detect duplicates",
      "Suggest categories",
      "Suggest splits from past choices",
      "Explain a balance",
    ],
  },
  settle: {
    label: "Settle",
    tint: "pink",
    icon: "check",
    title: "Pay how you always do. Tear it off.",
    body: "Bruno doesn't move money — it keeps the record straight. Venmo, cash, a round at the pub: mark it settled and the stub tears away. No confetti, just a clean slate.",
    features: ["Settlement tracking", "Confirm as recipient", "Payment history"],
  },
} as const satisfies Record<string, StoryContent>;

export const scanPreview: readonly Pick<BillLine, "name" | "price">[] = lupaLines.slice(0, 3);

export interface BalancePerson {
  readonly person: StackPerson;
  readonly caption: string;
  readonly amount: Cents;
  readonly direction: BalanceDirection;
}

export const balanceTotal = cents(8420);

export const balancePeople: readonly BalancePerson[] = [
  {
    person: { id: "so", name: "Sam Okafor", initials: "SO", tint: "pink" },
    caption: "owes you · Lupa, taxi",
    amount: cents(5240),
    direction: "owed",
  },
  {
    person: { id: "al", name: "Ana Lima", initials: "AL", tint: "amber" },
    caption: "owes you · Lisbon trip",
    amount: cents(3990),
    direction: "owed",
  },
  {
    person: { id: "pr", name: "Priya Raman", initials: "PR", tint: "blue" },
    caption: "you owe · groceries",
    amount: cents(810),
    direction: "owes",
  },
];

export interface CategorisedLine {
  readonly name: string;
  readonly price: Cents;
  readonly category: { readonly label: string; readonly tint: PaletteTint };
}

export const categorisedLines: readonly CategorisedLine[] = [
  { name: "Burrata", price: cents(1400), category: { label: "Starter", tint: "green" } },
  { name: "Negroni ×2", price: cents(2800), category: { label: "Drinks", tint: "pink" } },
];

export const flaggedLine = {
  name: "Tiramisu",
  guesses: [cents(900), cents(600)],
  chosen: cents(900),
} as const satisfies { name: string; guesses: readonly Cents[]; chosen: Cents };

export interface ExplanationRow {
  readonly label: string;
  readonly amount: Cents;
  readonly subtract?: boolean;
}

export interface BalanceExplanation {
  readonly title: string;
  readonly total: Cents;
  readonly rows: readonly ExplanationRow[];
}

export const balanceExplanation: BalanceExplanation = {
  title: "Why Sam owes you",
  total: cents(5240),
  rows: [
    { label: "Lupa · his share", amount: cents(2800) },
    { label: "Taxi · half", amount: cents(2440) },
    { label: "Minus what he covered", amount: cents(0), subtract: true },
  ],
};

export const settlePreview = {
  name: "Sam Okafor",
  firstName: "Sam",
  amount: cents(1240),
  method: "Venmo",
} as const satisfies { name: string; firstName: string; amount: Cents; method: string };

export interface Group {
  readonly name: string;
  readonly tint: PaletteTint;
  readonly meta: string;
  readonly members: readonly StackPerson[];
}

export const groups: readonly Group[] = [
  { name: "Lisbon trip", tint: "indigo", meta: "4 bills open", members: [people.you, people.sam, people.ana] },
  { name: "Flat 4B", tint: "orange", meta: "settled", members: [people.you, people.priya] },
  {
    name: "Sunday football",
    tint: "cyan",
    meta: "11 people",
    members: [people.sam, people.jk, { id: "more", name: "9 more", initials: "+9", tint: "neutral" }],
  },
];

export interface ForeignExpense {
  readonly name: string;
  readonly local: string;
  readonly home: Cents;
}

export const foreignExpenses: readonly ForeignExpense[] = [
  { name: "Pastéis de Belém", local: "€ 18.40 · EUR", home: cents(2005) },
  { name: "Tram day pass", local: "€ 7.00 · EUR", home: cents(763) },
  { name: "Izakaya, Shibuya", local: "¥ 6,800 · JPY", home: cents(4590) },
];

export const groupsContent = {
  title: "Built for the trip, the flat and the Sunday league.",
  body: "Groups keep a running tab. Currencies get converted at the day's rate so a bill in Lisbon still settles in dollars back home.",
  features: ["Groups and members", "Multi-currency"],
} as const;

export interface PlanFeature {
  readonly label: string;
  readonly highlight?: boolean;
}

export interface Plan {
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly badge?: string;
  readonly cta: { readonly label: string; readonly variant: "primary" | "elevated" };
  readonly features: readonly PlanFeature[];
  readonly footnote: string;
}

const sharedFeatures: readonly PlanFeature[] = [
  { label: "Unlimited manual entries" },
  { label: "Unlimited groups" },
  { label: "Smart settlements" },
  { label: "Multi-currency support" },
  { label: "Email notifications" },
];

export const pricingContent = {
  label: "Pricing",
  title: "Free for most dinners. Pro for the heavy splitters.",
  body: "Every feature on this page is free. Pro only raises the daily AI extraction limit and adds priority support. Cancel any time; your history stays.",
} as const;

export const plans: readonly Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    cta: { label: "Get started", variant: "elevated" },
    features: [{ label: "3 AI extractions per day" }, ...sharedFeatures],
    footnote: "AI extractions reset every day. Manual entry never runs out.",
  },
  {
    name: "Pro",
    price: "$2.99",
    period: "per month",
    badge: "50 scans a day",
    cta: { label: "Start Pro", variant: "primary" },
    features: [
      { label: "50 AI extractions per day", highlight: true },
      ...sharedFeatures,
      { label: "Priority support", highlight: true },
      { label: "Early access to features", highlight: true },
    ],
    footnote: "Billed monthly. No card needed until you upgrade.",
  },
];

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

export const faqs: readonly Faq[] = [
  {
    question: "Do my friends need an account?",
    answer:
      "No. They open your link, tap what they had, and that's it. An account only matters if they want their own history and balances.",
  },
  {
    question: "Does Bruno move money?",
    answer:
      "Never. Bruno keeps the record of who owes whom. You pay each other the way you already do — Venmo, PayPal, cash — then mark it settled.",
  },
  {
    question: "How accurate is the receipt reading?",
    answer:
      "Very good on printed receipts, decent on crumpled ones. Every line is editable, and you can always add the bill by hand.",
  },
  {
    question: "What happens when I hit the free limit?",
    answer:
      "Manual entry stays unlimited. AI extraction resets to three the next day, or Pro gives you fifty a day for $2.99 a month.",
  },
];

export const heroContent = {
  title: "Split the bill, not friendships.",
  body: "Upload the receipt and AI reads it. Friends tap what they had. Bruno works out who owes whom — one number each, no spreadsheet, no awkward chat.",
  footnote: "Free for 3 AI extractions a day. Friends don't need an account to claim.",
} as const;

export const footerContent = {
  tagline: "Split the bill, not friendships.",
  credit: { label: "Built by Rithvik", href: "https://github.com/Rithvik8001" },
} as const;
