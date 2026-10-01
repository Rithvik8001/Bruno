import "server-only";
import { serverEnv } from "@/lib/env";

export class AskNotConfiguredError extends Error {
  constructor() {
    super("Ask Bruno is not configured");
    this.name = "AskNotConfiguredError";
  }
}

export function askApiKey(): string {
  const { OPENAI_API_KEY } = serverEnv();
  if (!OPENAI_API_KEY) throw new AskNotConfiguredError();
  return OPENAI_API_KEY;
}

export function isAskConfigured(): boolean {
  return Boolean(serverEnv().OPENAI_API_KEY);
}
