export const aiMessages = {
  cooling: (seconds: number) => `Bruno is busy. Try again in ${seconds} seconds.`,
  busy: "Bruno is having trouble right now. Try again in a minute, or type this one in.",
  tooManyTries: "That’s too many tries for one day. Type this one in, or come back tomorrow.",
} as const;

export const assistNames = {
  scan: "Scan it",
  say: "Say it",
  ask: "Ask Bruno",
  manual: "Type it in",
} as const;

export const allowanceCopy = {
  left: (left: number, limit: number) => `${left} of ${limit} assists left`,
  leftShort: (left: number, limit: number) => `${left} of ${limit} left`,
  none: "No assists left today",
  noneShort: "None left",
  spent: (limit: number) => `You’ve used today’s ${limit} assists.`,
  refused: (limit: number) => `You’ve used today’s ${limit} assists. They’re back at midnight.`,
  resets: `${assistNames.scan}, ${assistNames.say} and ${assistNames.ask} are back at midnight. Typing a bill in is always free.`,
  proSoon: (proLimit: number) => `Pro is coming soon, with ${proLimit} assists a day.`,
  cost: "Uses 1 assist",
  notCounted: "This one didn’t use an assist.",
} as const;
