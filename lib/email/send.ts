import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { isProduction, serverEnv } from "@/lib/env";

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly react: ReactElement;
  readonly text: string;
  readonly idempotencyKey: string;
}

let client: Resend | undefined;

function resend(apiKey: string): Resend {
  client ??= new Resend(apiKey);
  return client;
}

function logToConsole({ to, subject, text }: EmailMessage): void {
  console.info(`\n[email] → ${to}\n        ${subject}\n        ${text.replace(/\n/g, "\n        ")}\n`);
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!isProduction()) {
    logToConsole(message);
    return;
  }
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is required to send email in production");

  const { error } = await resend(RESEND_API_KEY).emails.send(
    { from: EMAIL_FROM, to: message.to, subject: message.subject, react: message.react, text: message.text },
    { idempotencyKey: message.idempotencyKey },
  );
  if (error) throw new Error(`Resend rejected email "${message.subject}": ${error.name} — ${error.message}`);
}
