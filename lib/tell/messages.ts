import { TELL_TEXT_MAX } from "./rules";

export type TellFailure = "notBill" | "vague" | "timeout" | "failed";

export const tellMessages = {
  unavailable: "Tell Bruno isn't switched on for this build yet. Type the bill in instead.",
  textMissing: "Tell Bruno what the bill was.",
  textTooLong: `Keep it to ${TELL_TEXT_MAX} characters, just the bill bits.`,
  rateLimited: "That's a lot of drafts at once. Give it a minute.",
  gone: "That draft has expired. Tell Bruno again.",
  cooling: (seconds: number) => `Bruno needs a breather. Try again in ${seconds} seconds.`,
  busy: "Bruno’s AI is having trouble right now. Give it a minute, or type this one in.",
  tooManyTries: "That’s a lot of tries for one day. Type this one in, or come back tomorrow.",
  fallbackItem: "Bill",
  notBill: "Bruno couldn't find a bill in that.",
  vague: "Bruno couldn't find a bill in that.",
  timeout: "That took too long. Give it another go.",
  failed: "Something went wrong while drafting the bill.",
} as const;

export function tellFailureMessage(failure: TellFailure): string {
  return tellMessages[failure];
}
