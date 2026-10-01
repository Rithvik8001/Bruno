export const askActionMessages = {
  gone: "That card isn’t active any more. Ask Bruno again.",
  rateLimited: "That’s a lot of changes at once. Try again in a minute.",
  pickSomeone: "Pick at least one person to remind.",
  notSent: "Nobody could be emailed just now, so nothing was sent.",
  tooManyReminders: "That’s plenty of reminders for now. Try again later.",
  amountMissing: "Enter an amount first.",
  cantUndo: "It’s too late to undo this one.",
} as const;
