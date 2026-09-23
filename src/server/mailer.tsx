import { render } from "@react-email/render";
import type { ReactElement } from "react";

import { toDbDate, type CalendarDate } from "@/lib/calendar";

import { emailCopy } from "./emails/copy";
import { fill } from "./emails/format";
import {
  AccountDeletedEmail,
  AlreadyRegisteredEmail,
  ComingUpEmail,
  MonthlyDigestEmail,
  PasswordChangedEmail,
  RenewalReminderEmail,
  RenewsTodayEmail,
  ResetCodeEmail,
  SignupCodeEmail,
  TrialReminderEmail,
  WelcomeEmail,
  batchValues,
  digestValues,
  renewalValues,
} from "./emails/templates";
import type {
  BatchEmail,
  BatchSlot,
  DigestEmail,
  ReminderKind,
  RenewalEmail,
} from "./emails/types";
import { readMailerEnv } from "./env";
import { resendClient } from "./resend";

type SendInput = {
  to: string;
  subject: string;
  react: ReactElement;
  idempotencyKey: string;
  kind: string;
};

const msPerHour = 60 * 60 * 1000;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function hourStamp(): string {
  return String(Math.floor(Date.now() / msPerHour));
}

function dayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function sendEmail(input: SendInput): Promise<boolean> {
  const client = resendClient();
  if (client === null) {
    console.log(`[bruno mail] ${input.subject} -> ${input.to} (no api key)`);
    return true;
  }

  const env = readMailerEnv();
  const html = await render(input.react);
  const text = await render(input.react, { plainText: true });

  const { data, error } = await client.emails.send(
    {
      from: env.from,
      replyTo: env.replyTo ?? undefined,
      to: [input.to],
      subject: input.subject,
      html,
      text,
      tags: [{ name: "kind", value: input.kind }],
    },
    { idempotencyKey: input.idempotencyKey },
  );

  if (error !== null) {
    console.error("[bruno mail] send failed", input.idempotencyKey, error.message);
    return false;
  }
  return data !== null;
}

export async function deliverSignupCode(
  email: string,
  code: string,
): Promise<boolean> {
  if (!isProduction()) {
    console.log(`[bruno auth] verification code for ${email}: ${code}`);
  }
  return sendEmail({
    to: email,
    subject: emailCopy.code.subject,
    react: <SignupCodeEmail code={code} />,
    idempotencyKey: `signup-code/${email}/${code}`,
    kind: "signup_code",
  });
}

export async function deliverResetCode(
  email: string,
  code: string,
): Promise<boolean> {
  if (!isProduction()) {
    console.log(`[bruno auth] reset code for ${email}: ${code}`);
  }
  return sendEmail({
    to: email,
    subject: emailCopy.reset.subject,
    react: <ResetCodeEmail code={code} />,
    idempotencyKey: `reset-code/${email}/${code}`,
    kind: "reset_code",
  });
}

export function deliverAlreadyRegistered(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: emailCopy.alreadyRegistered.subject,
    react: <AlreadyRegisteredEmail />,
    idempotencyKey: `already-registered/${email}/${dayStamp()}`,
    kind: "already_registered",
  });
}

export function deliverPasswordChanged(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: emailCopy.passwordChanged.subject,
    react: <PasswordChangedEmail />,
    idempotencyKey: `password-changed/${email}/${hourStamp()}`,
    kind: "password_changed",
  });
}

export function deliverWelcome(email: string, userId: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: emailCopy.welcome.subject,
    react: <WelcomeEmail />,
    idempotencyKey: `welcome/${userId}`,
    kind: "welcome",
  });
}

export function deliverAccountDeleted(email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: emailCopy.accountDeleted.subject,
    react: <AccountDeletedEmail />,
    idempotencyKey: `account-deleted/${email}/${hourStamp()}`,
    kind: "account_deleted",
  });
}

export function deliverRenewalReminder(
  email: string,
  subscriptionId: string,
  input: RenewalEmail,
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: fill(emailCopy.renewal.subject, renewalValues(input)),
    react: <RenewalReminderEmail input={input} />,
    idempotencyKey: `renewal/${subscriptionId}/${toDbDate(input.renewsOn)}`,
    kind: "renewal_reminder",
  });
}

export function deliverTrialReminder(
  email: string,
  subscriptionId: string,
  input: RenewalEmail,
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: fill(emailCopy.trial.subject, renewalValues(input)),
    react: <TrialReminderEmail input={input} />,
    idempotencyKey: `trial/${subscriptionId}/${toDbDate(input.renewsOn)}`,
    kind: "trial_reminder",
  });
}

export function deliverRenewsToday(
  email: string,
  subscriptionId: string,
  input: RenewalEmail,
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: fill(emailCopy.today.subject, renewalValues(input)),
    react: <RenewsTodayEmail input={input} />,
    idempotencyKey: `renews-today/${subscriptionId}/${toDbDate(input.renewsOn)}`,
    kind: "renews_today",
  });
}

export function deliverMonthlyDigest(
  email: string,
  userId: string,
  input: DigestEmail,
): Promise<boolean> {
  const month: CalendarDate = { ...input.month, day: 1 };
  return sendEmail({
    to: email,
    subject: fill(emailCopy.digest.subject, digestValues(input)),
    react: <MonthlyDigestEmail input={input} />,
    idempotencyKey: `digest/${userId}/${toDbDate(month).slice(0, 7)}`,
    kind: "monthly_digest",
  });
}

export function deliverReminder(
  email: string,
  kind: ReminderKind,
  subscriptionId: string,
  input: RenewalEmail,
): Promise<boolean> {
  switch (kind) {
    case "renewal":
      return deliverRenewalReminder(email, subscriptionId, input);
    case "trial":
      return deliverTrialReminder(email, subscriptionId, input);
    case "renews_today":
      return deliverRenewsToday(email, subscriptionId, input);
  }
}

export function deliverBatch(
  email: string,
  userId: string,
  day: CalendarDate,
  slot: BatchSlot,
  input: BatchEmail,
): Promise<boolean> {
  const first = input.items[0];
  if (first === undefined) {
    return Promise.resolve(false);
  }
  if (input.items.length === 1) {
    return deliverReminder(email, first.kind, first.subscriptionId, first.input);
  }
  return sendEmail({
    to: email,
    subject: fill(emailCopy.batch.subject, batchValues(input)),
    react: <ComingUpEmail input={input} />,
    idempotencyKey: `${slot}/${userId}/${toDbDate(day)}`,
    kind: "coming_up",
  });
}
