import { buddyHash } from "./buddies";

const FILES = {
  luggage: "luggage",
  plane: "airplane",
  beach: "beach-with-umbrella",
  tent: "tent",
  house: "house",
  cart: "shopping-cart",
  soccer: "soccer-ball",
  pizza: "pizza",
  sushi: "sushi",
  cocktail: "cocktail-glass",
  cheers: "clinking-glasses",
  party: "party-popper",
  cake: "birthday-cake",
  gift: "wrapped-gift",
  popcorn: "popcorn",
  coffee: "hot-beverage",
  basketball: "basketball",
  gaming: "video-game",
  car: "automobile",
  mountain: "snow-capped-mountain",
  xmas: "christmas-tree",
  dog: "dog-face",
  grad: "graduation-cap",
  ticket: "ticket",
  music: "musical-notes",
  bike: "bicycle",
  burger: "hamburger",
  beer: "beer-mug",
  ring: "ring",
  palm: "palm-tree",
  moneybag: "money-bag",
  moneywings: "money-with-wings",
  receipt: "receipt",
  bell: "bell",
  check: "check-mark-button",
  trophy: "trophy",
  card: "credit-card",
  lock: "locked",
  gem: "gem-stone",
  envelope: "envelope",
  memo: "memo",
  warning: "warning",
  sparkles: "sparkles",
  people: "busts-in-silhouette",
  key: "key",
  phone: "mobile-phone",
  link: "link",
  hourglass: "hourglass-done",
  camera: "camera",
} as const;

export type Icon3dId = keyof typeof FILES;

export function icon3dSrc(id: Icon3dId): string {
  return `/icons/3d/${FILES[id]}.png`;
}

export const groupArt = {
  luggage: "Trip",
  plane: "Flights",
  beach: "Beach",
  tent: "Camping",
  house: "Home",
  cart: "Groceries",
  soccer: "Football",
  pizza: "Dinner",
  sushi: "Sushi",
  cocktail: "Drinks",
  cheers: "Friends",
  party: "Party",
  cake: "Birthday",
  gift: "Gifts",
  popcorn: "Movies",
  coffee: "Coffee",
  basketball: "Hoops",
  gaming: "Gaming",
  car: "Road trip",
  mountain: "Ski trip",
  xmas: "Holidays",
  dog: "Pets",
  grad: "Uni",
  ticket: "Events",
  music: "Gigs",
  bike: "Cycling",
  burger: "Takeout",
  beer: "Pub",
  ring: "Wedding",
  palm: "Tropical",
} as const satisfies Partial<Record<Icon3dId, string>>;

export type GroupArtId = keyof typeof groupArt;
export const GROUP_ART_IDS = Object.keys(groupArt) as readonly GroupArtId[];

export const momentIcons = {
  moneybag: "Paid",
  moneywings: "Settled",
  receipt: "Bill / scan",
  check: "Claimed · done",
  bell: "Reminder",
  link: "Joined",
  people: "Group / empty",
  hourglass: "Quiet",
  envelope: "Email sent",
  key: "Code · account",
  lock: "Password",
  gem: "Pro",
  card: "Payments",
  phone: "Device",
  memo: "Type it in",
  warning: "Error",
  sparkles: "AI · success",
  trophy: "Milestone",
  party: "Welcome",
  camera: "Camera",
} as const satisfies Partial<Record<Icon3dId, string>>;

export type MomentIconId = keyof typeof momentIcons;
export const MOMENT_ICON_IDS = Object.keys(momentIcons) as readonly MomentIconId[];

const RULES: readonly (readonly [RegExp, GroupArtId])[] = [
  [/tropical|palm|hawaii|maldives|caribbean/i, "palm"],
  [/ski|snow|alps|mountain|chalet/i, "mountain"],
  [/road ?trip|carpool|car |drive|fuel|petrol/i, "car"],
  [/wedding|engage|bride|groom|ring/i, "ring"],
  [/christmas|xmas|holiday season|diwali|eid/i, "xmas"],
  [/dog|pet|cat|vet|puppy/i, "dog"],
  [/uni|class|school|college|study|campus/i, "grad"],
  [/concert|gig|band|music|karaoke/i, "music"],
  [/ticket|event|conference|game day/i, "ticket"],
  [/basketball|hoops|nba/i, "basketball"],
  [/gaming|xbox|ps5|playstation|lan|board ?game/i, "gaming"],
  [/bike|cycl|ride/i, "bike"],
  [/coffee|cafe|café|latte/i, "coffee"],
  [/burger|takeout|takeaway|delivery|uber ?eats/i, "burger"],
  [/beer|pub|brewery/i, "beer"],
  [/beach|goa|bali|summer|island|coast/i, "beach"],
  [/camp|hike|tent|trek|festival/i, "tent"],
  [/flight|fly|airport/i, "plane"],
  [/trip|travel|lisbon|paris|tokyo|holiday|vacation|getaway|weekend away/i, "luggage"],
  [/flat|home|house|apartment|roomie|room ?mate|flatmate|rent|bills? at|4b/i, "house"],
  [/grocer|shop|market|costco|supplies/i, "cart"],
  [/football|soccer|futsal|sport|match|league|5.?a.?side/i, "soccer"],
  [/sushi|ramen|japan/i, "sushi"],
  [/pizza|dinner|lunch|brunch|food|restaurant|lupa|osteria|friday/i, "pizza"],
  [/drink|bar|cocktail|night ?out|happy hour/i, "cocktail"],
  [/birthday|bday|cake/i, "cake"],
  [/gift|santa|present/i, "gift"],
  [/party|celebrat|bach/i, "party"],
  [/movie|cinema|film|netflix|show/i, "popcorn"],
  [/friends|crew|gang|squad|besties|mates|family/i, "cheers"],
];

const FALLBACK: readonly GroupArtId[] = ["cheers", "party", "pizza", "luggage", "house", "popcorn"];

export function matchGroupArt(name: string): GroupArtId | null {
  for (const [pattern, id] of RULES) if (pattern.test(name)) return id;
  return null;
}

export function groupArtFor(name: string, chosen?: GroupArtId | null): GroupArtId {
  if (chosen) return chosen;
  return matchGroupArt(name) ?? FALLBACK[buddyHash(name) % FALLBACK.length] ?? "cheers";
}
