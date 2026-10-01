export const aiMessages = {
  cooling: (seconds: number) => `Bruno needs a breather. Try again in ${seconds} seconds.`,
  busy: "Bruno’s AI is having trouble right now. Give it a minute, or type this one in.",
  tooManyTries: "That’s a lot of tries for one day. Type this one in, or come back tomorrow.",
} as const;
