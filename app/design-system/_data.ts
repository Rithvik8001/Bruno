import type { ScanLine } from "@/components/patterns/receipt-scan";
import type { AvatarSize, StackPerson } from "@/components/ui/avatar";
import type { BuddyShape } from "@/lib/design-system/buddies";
import { GROUP_ART_IDS, type GroupArtId, type MomentIconId } from "@/lib/design-system/icons3d";
import type { IconName } from "@/components/icons/icon";
import type { BillStatus } from "@/lib/design-system/semantics";
import type { PaletteTint, Tint } from "@/lib/design-system/tokens";
import { cents, type Cents } from "@/lib/money";

export interface Principle {
  readonly title: string;
  readonly body: string;
  readonly tint: PaletteTint;
}

export const principles: readonly Principle[] = [
  {
    tint: "violet",
    title: "Colour names things, neutrals hold the page.",
    body: "Tints belong to statuses, people and groups. Canvas, text and chrome stay neutral.",
  },
  {
    tint: "green",
    title: "The figure is the headline.",
    body: "Money is the largest element on a screen. Owed is green, owe is red, settled is grey.",
  },
  {
    tint: "blue",
    title: "One thing to do next.",
    body: "One brand-coloured action per screen. Competing actions become text.",
  },
  {
    tint: "orange",
    title: "Soft, not glossy.",
    body: "Flat tints, 10 and 20px radii, one shadow. No gradients, no glass.",
  },
  {
    tint: "pink",
    title: "Say it like a friend would.",
    body: "“Sam owes you 12.40.” Sentence case, short verbs, no exclamation marks.",
  },
];

export const tintShowcase = {
  violet: "queued",
  blue: "scheduled",
  orange: "claiming",
  red: "overdue",
  green: "settled",
  pink: "waiting",
  amber: "paused",
  cyan: "reviewing",
  indigo: null,
} as const satisfies Record<PaletteTint, BillStatus | null>;

export const rowStatuses: readonly BillStatus[] = [
  "queued",
  "scheduled",
  "claiming",
  "overdue",
  "settled",
  "reviewing",
];

export interface GroupTag {
  readonly id: string;
  readonly name: string;
  readonly tint: Tint;
}

export const groups: readonly GroupTag[] = [
  { id: "lisbon", name: "Lisbon trip", tint: "indigo" },
  { id: "flat", name: "Flat 4B", tint: "orange" },
  { id: "football", name: "Sunday football", tint: "cyan" },
];

export interface Balance {
  readonly id: string;
  readonly name: string;
  readonly tint: Tint;
  readonly caption: string;
  readonly amount: Cents;
}

export const balances: readonly Balance[] = [
  { id: "sam", name: "Sam Okafor", tint: "pink", caption: "owes you", amount: cents(1240) },
  { id: "priya", name: "Priya Raman", tint: "blue", caption: "you owe", amount: cents(-810) },
  { id: "ana", name: "Ana Lima", tint: "amber", caption: "settled last week", amount: cents(0) },
];

export const stack: readonly StackPerson[] = [
  { id: "me", name: "You", tint: "violet", initials: "R" },
  { id: "sam", name: "Sam Okafor", tint: "pink" },
  { id: "priya", name: "Priya Raman", tint: "blue" },
  { id: "ana", name: "Ana Lima", tint: "amber" },
];

export const crowd: readonly StackPerson[] = [
  { id: "sam", name: "Sam", tint: "pink", initials: "S" },
  { id: "priya", name: "Priya Raman", tint: "blue" },
  { id: "ana", name: "Ana Lima", tint: "amber" },
  { id: "leo", name: "Leo Park", tint: "green" },
  { id: "mia", name: "Mia Chen", tint: "cyan" },
  { id: "tom", name: "Tom Hale", tint: "red" },
];

export interface ReceiptItem {
  readonly id: string;
  readonly name: string;
  readonly price: Cents;
  readonly others: readonly string[];
}

export const receiptItems: readonly ReceiptItem[] = [
  { id: "burrata", name: "Burrata", price: cents(1400), others: ["Priya"] },
  { id: "rigatoni", name: "Rigatoni", price: cents(1900), others: [] },
  { id: "negroni", name: "Negroni ×2", price: cents(2800), others: ["Sam", "Ana"] },
  { id: "tiramisu", name: "Tiramisu", price: cents(900), others: [] },
  { id: "water", name: "Sparkling water", price: cents(600), others: ["Ana"] },
];

export const scanLines: readonly ScanLine[] = [
  { id: "burrata", name: "Burrata", price: cents(1400), category: "Starter", tint: "green", ghostWidth: "62%" },
  { id: "rigatoni", name: "Rigatoni", price: cents(1900), category: "Main", tint: "orange", ghostWidth: "48%" },
  { id: "negroni", name: "Negroni ×2", price: cents(2800), category: "Drinks", tint: "pink", ghostWidth: "70%" },
  { id: "tiramisu", name: "Tiramisu", price: cents(900), category: "Dessert", tint: "violet", ghostWidth: "54%" },
  { id: "water", name: "Sparkling water", price: cents(600), category: "Drinks", tint: "pink", ghostWidth: "78%" },
];

export interface ProductPattern {
  readonly title: string;
  readonly body: string;
  readonly where: string;
  readonly tint: Tint;
}

export const productPatterns: readonly ProductPattern[] = [
  { title: "Live presence", body: "Green dot on avatars of people viewing the bill; new claims pop in with a spring.", where: "Live claiming", tint: "green" },
  { title: "Rolling share", body: "Your total rolls digit by digit on every claim, 300ms.", where: "Live claiming", tint: "brand" },
  { title: "Totals check", body: "A single status line turns green the moment items + tax + tip match the receipt.", where: "Review items", tint: "amber" },
  { title: "Split remainder", body: "Status chip counts what’s left or over; a one-tap fix fills the rest.", where: "Split editor", tint: "orange" },
  { title: "Explain a balance", body: "Disclosure grows open (grid-rows 0fr → 1fr) to show the maths behind a number.", where: "Receipt detail", tint: "violet" },
  { title: "Copy confirm", body: "Copy buttons swap to a green “Copied” for 2s. No toast needed.", where: "Group detail", tint: "cyan" },
];

export interface BuddySpecimen {
  readonly shape: BuddyShape;
  readonly name: string;
  readonly tint: PaletteTint;
}

export const buddySpecimens: readonly BuddySpecimen[] = [
  { shape: "mochi", name: "Rithvik Kumar", tint: "violet" },
  { shape: "miso", name: "Sam Okafor", tint: "blue" },
  { shape: "bun", name: "Priya Raman", tint: "cyan" },
  { shape: "bolt", name: "Ana Nunes", tint: "green" },
  { shape: "bruin", name: "Jo Mills", tint: "amber" },
  { shape: "sprout", name: "Leo Vance", tint: "orange" },
  { shape: "swoop", name: "Tess Cole", tint: "pink" },
  { shape: "pom", name: "Mia Brooks", tint: "indigo" },
];

export const buddySizes: readonly AvatarSize[] = ["sm", "md", "xl", "2xl", "3xl"];

export const buddyStack: readonly StackPerson[] = [
  { id: "so", name: "Sam Okafor", tint: "pink" },
  { id: "pr", name: "Priya Raman", tint: "cyan" },
  { id: "an", name: "Ana Nunes", tint: "green" },
  { id: "jm", name: "Jo Mills", tint: "amber" },
];

export interface BuddyRule {
  readonly title: string;
  readonly body: string;
}

export const buddyRules: readonly BuddyRule[] = [
  {
    title: "One face",
    body: "Cream face, two capsule eyes, soft blush, no mouth. The cuteness is in proportion and tilt, not expression.",
  },
  {
    title: "Shape is yours",
    body: "Picked in onboarding. Until someone picks, the shape comes from a hash of their name, so it never changes between screens.",
  },
  {
    title: "Colour is theirs",
    body: "Silhouette in the person's saturated tint on a light wash of the same hue. Works on both themes.",
  },
  {
    title: "Alive, quietly",
    body: "Blinks every few seconds, out of sync with its neighbours. Smiles when you hover. Still under reduced motion only if the OS asks.",
  },
  {
    title: "Accessible",
    body: "The person's name is the accessible label; initials remain as the tooltip fallback.",
  },
  {
    title: "Tiny sizes",
    body: "Below 22px the blush drops; eyes and silhouette carry recognition down to 16px.",
  },
];

export interface GroupArtSpecimen {
  readonly art: GroupArtId;
  readonly tint: PaletteTint;
}

const artTintCycle: readonly PaletteTint[] = ["indigo", "blue", "cyan", "green", "orange", "amber", "red", "pink", "violet"];

export const groupArtSpecimens: readonly GroupArtSpecimen[] = GROUP_ART_IDS.map((art, i) => ({
  art,
  tint: artTintCycle[i % artTintCycle.length] ?? "indigo",
}));

export interface FlatIconSpecimen {
  readonly icon: IconName;
  readonly label: string;
}

export const flatIconSpecimens: readonly FlatIconSpecimen[] = [
  { icon: "home", label: "Home" },
  { icon: "receipt", label: "Receipt" },
  { icon: "card", label: "Card" },
  { icon: "check-circle", label: "Status" },
];

export interface MomentSpecimen {
  readonly icon: MomentIconId;
  readonly tint: PaletteTint;
}

export const momentSpecimens: readonly MomentSpecimen[] = [
  { icon: "moneybag", tint: "green" },
  { icon: "moneywings", tint: "green" },
  { icon: "receipt", tint: "violet" },
  { icon: "check", tint: "blue" },
  { icon: "bell", tint: "amber" },
  { icon: "link", tint: "cyan" },
  { icon: "people", tint: "indigo" },
  { icon: "hourglass", tint: "cyan" },
  { icon: "envelope", tint: "blue" },
  { icon: "key", tint: "amber" },
  { icon: "lock", tint: "violet" },
  { icon: "gem", tint: "violet" },
  { icon: "card", tint: "blue" },
  { icon: "phone", tint: "cyan" },
  { icon: "memo", tint: "cyan" },
  { icon: "warning", tint: "red" },
  { icon: "sparkles", tint: "green" },
  { icon: "trophy", tint: "amber" },
  { icon: "party", tint: "pink" },
  { icon: "camera", tint: "violet" },
];

export const groupArtCopy = {
  title: "Group art",
  body: "Thirty 3D objects. Picked automatically from the group's name (trip → luggage, flat → house, football → ball) until someone chooses one in New group or by tapping the group's icon. Tile is the group's tint at radius 14–20, icon at 68%. In chips the icon replaces the dot. Unknown names get a stable fallback. Fluent Emoji 3D, MIT.",
} as const;

export const iconTiersCopy = {
  title: "Two icon tiers",
  body: "Flat duotone for anything you tap (nav, buttons, inputs) — crisp at 16–24px. 3D objects for moments: activity events, empty states, success, errors, section headers. Never 3D below 20px.",
} as const;
