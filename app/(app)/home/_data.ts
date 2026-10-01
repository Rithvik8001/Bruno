export const HOME_PREVIEWS = ["empty", "loading"] as const;
export type HomePreview = (typeof HOME_PREVIEWS)[number];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const homeCopy = {
  metaTitle: "Home",
  headline: { owed: "You’re owed", owes: "You owe", settled: "All square", empty: "Welcome to Bruno" },
  fallbackGreeting: (firstName: string) => `Hi, ${firstName}`,
  greetings: {
    late: "Up late",
    morning: "Morning",
    friday: "Happy Friday",
    afternoon: "Afternoon",
    evening: "Evening",
  },
  others: (parts: readonly string[]) => `Also ${parts.join(" and ")} in other currencies`,
  people: {
    title: "People",
    owesYou: (n: number) => (n === 1 ? "1 owes you" : `${n} owe you`),
    youOwe: (n: number) => `${n} you owe`,
    allSquare: "All square",
    captionOwed: (titles: readonly string[]) => (titles.length > 0 ? `owes you · ${titles.join(", ")}` : "owes you"),
    captionOwes: (titles: readonly string[]) => (titles.length > 0 ? `you owe · ${titles.join(", ")}` : "you owe"),
    captionSquare: "all square",
  },
  bills: {
    title: "Open bills",
    allActivity: "All activity",
    owedToYou: (n: number) => (n === 1 ? "1 owes you" : `${n} owe you`),
    youOwe: (amount: string) => `you owe ${amount}`,
    claiming: (claimed: number, items: number) => `${claimed} of ${items} claimed`,
  },
  nextUp: {
    owesYou: (first: string, amount: string) => `${first} owes you ${amount}`,
    youOwe: (first: string, amount: string) => `You owe ${first} ${amount}`,
    subtitle: (titles: readonly string[], age: string) => [titles.join(" and "), age].filter(Boolean).join(" · "),
    age: (days: number) => (days <= 0 ? "today" : days === 1 ? "since yesterday" : `${plural(days, "day", "days")} old`),
    cta: "View bill",
    confirmTitle: (first: string, amount: string) => `${first} says they paid you ${amount}`,
    confirmSub: "Check it landed, then confirm",
    confirmCta: "Confirm",
    oweCta: "Settle up",
  },
  empty: {
    title: "Nothing owed, nothing owing",
    body: "Add your first bill and Bruno will keep the score from here.",
    add: "Add a bill",
    group: "Start a group",
  },
  breakdown: {
    owed: (first: string, amount: string) => `${first} ${amount}`,
    owes: (first: string, amount: string) => `minus ${amount} to ${first}`,
  },
} as const;
