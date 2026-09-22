import { Resend } from "resend";

import { readMailerEnv } from "./env";

let client: Resend | null | undefined;

export function resendClient(): Resend | null {
  if (client === undefined) {
    const env = readMailerEnv();
    client = env.resendApiKey === null ? null : new Resend(env.resendApiKey);
  }
  return client;
}
