const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const claimCopy = {
  metaTitle: "Take over your spot",
  savedSpot: (by: string) => `${by} saved you a spot`,
  savedSpotAnon: "Someone saved you a spot",
  title: (guest: string, group: string) => `Take over ${guest}'s spot in ${group}`,
  body: (by: string, guest: string) =>
    `${by} added you as a guest. Take it over and everything logged for ${guest} moves to your account.`,
  guestTag: "Guest",
  addedOn: (by: string | null, date: string) => (by ? `Added by ${by} on ${date}` : `Added on ${date}`),
  carryTitle: "What carries over",
  bills: (n: number) => plural(n, "bill", "bills"),
  noBills: "No bills yet",
  owes: (name: string | null) => (name ? `Owes ${name}` : "Owes the group"),
  owed: (name: string | null) => (name ? `${name} owes them` : "The group owes them"),
  square: "All square",
  squareSub: "Nothing left to settle",
  settled: "Settled",
  forBills: (titles: readonly string[]) => (titles.length > 0 ? `For ${titles.join(", ").toLowerCase()}` : "Across the group"),
  history: "History",
  historySub: (claims: number, payments: number) =>
    [claims > 0 && plural(claims, "claim", "claims"), payments > 0 && plural(payments, "payment", "payments")]
      .filter(Boolean)
      .join(" and ") || "Nothing else yet",
  take: "Take over this spot",
  notYou: "Not you? Join as yourself",
  oneUse: "This link is just for you and works once.",
  signIn: "Sign in to take over",
  signUp: "Create an account",
  comeBack: "We'll bring you straight back here.",
  done: {
    title: (group: string) => `You're in ${group}`,
    body: (guest: string, by: string | null) =>
      `${guest}'s spot is yours now. ${by ? `${by} and the group` : "The group"} see you instead.`,
    moved: (bills: number, claims: number, payments: number) =>
      `${[plural(bills, "bill", "bills"), plural(claims, "claim", "claims"), payments > 0 && plural(payments, "payment", "payments")].filter(Boolean).join(", ")} ${bills + claims + payments === 1 ? "is" : "are"} now under your name`,
    owes: (name: string | null, amount: string) => `You owe ${name ?? "the group"} ${amount}`,
    owed: (name: string | null, amount: string) => `${name ?? "The group"} owes you ${amount}`,
    square: "You're all square with the group",
    gone: (guest: string) => `${guest} is gone from the member list`,
    open: (group: string) => `Open ${group}`,
  },
  alreadyMember: {
    title: (group: string) => `You've been in ${group} before`,
    body: "So this spot can't be merged into your account. Ask a member to remove the guest instead.",
    howTitle: "How to sort it",
    steps: (by: string | null, guest: string) => [
      `Ask ${by ?? "anyone in the group"} to open Members.`,
      `They tap ${guest} and choose Remove once any balance is settled.`,
      `Anything ${guest} owed can be moved onto your bills by hand.`,
    ],
    cta: (group: string) => `Open ${group}`,
  },
  invalid: {
    title: "This link doesn't work",
    body: "No harm done. Guest links are private and only last a little while, so ask for a fresh one.",
    howTitle: "Ask for a new link",
    steps: [
      "Message whoever added you to the group.",
      "They open Members, tap your guest spot and choose Send invite link.",
      "Open the new link and you can take over from there.",
    ],
    cta: "Go to Bruno",
  },
} as const;
