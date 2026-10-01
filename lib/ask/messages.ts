import { assistNames } from "@/lib/ai/messages";
import { ASK_TEXT_MAX } from "./rules";

export const askMessages = {
  unavailable: `${assistNames.ask} isn’t available right now.`,
  textMissing: "Type a question first.",
  textTooLong: `Keep it under ${ASK_TEXT_MAX} characters.`,
  rateLimited: "That’s a lot of questions at once. Try again in a minute.",
  busy: "Bruno’s still on your last question. Wait for that answer, then ask again.",
  trouble: "Bruno is having trouble right now. Try again in a minute.",
  tooManyTries: "That’s too many tries for one day. Come back tomorrow.",
  offTopic: (seconds: number) => `Bruno only answers about your bills. Try again in ${seconds} seconds.`,
  notMember: "That group isn’t one of yours. Pick one of your groups and ask again.",
  gone: "That question has expired. Ask it again.",
  timeout: "Bruno took too long on that one. Try again, or ask something narrower.",
  failed: "Bruno couldn’t work that one out. Try wording it another way.",
  badOrigin: "That request didn’t come from Bruno. Reload the page and try again.",
} as const;
