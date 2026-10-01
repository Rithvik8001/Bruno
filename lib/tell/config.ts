import "server-only";
import { serverEnv } from "@/lib/env";

export class TellNotConfiguredError extends Error {
  constructor() {
    super("Tell Bruno is not configured");
    this.name = "TellNotConfiguredError";
  }
}

export function tellApiKey(): string {
  const { OPENAI_API_KEY } = serverEnv();
  if (!OPENAI_API_KEY) throw new TellNotConfiguredError();
  return OPENAI_API_KEY;
}

export function isTellConfigured(): boolean {
  return Boolean(serverEnv().OPENAI_API_KEY);
}
