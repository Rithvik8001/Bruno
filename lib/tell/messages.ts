import { assistNames } from "@/lib/ai/messages";
import { TELL_TEXT_MAX } from "./rules";

export type TellFailure = "notBill" | "vague" | "timeout" | "failed";

const noBill = "Bruno couldn’t find a bill in that. Say what it was, how much, and who paid.";

export const tellMessages = {
  unavailable: `${assistNames.say} isn’t available right now. Type the bill in instead.`,
  textMissing: "Say what the bill was.",
  textTooLong: `Keep it to ${TELL_TEXT_MAX} characters, just the bill bits.`,
  rateLimited: "That’s a lot of drafts at once. Try again in a minute.",
  gone: "That draft has expired. Say it again.",
  fallbackItem: "Bill",
  notBill: noBill,
  vague: noBill,
  timeout: "That took too long. Try again in a moment.",
  failed: "Bruno couldn’t draft that bill. Try again, or type it in.",
} as const;

export function tellFailureMessage(failure: TellFailure): string {
  return tellMessages[failure];
}
