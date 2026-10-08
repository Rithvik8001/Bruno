import "server-only";
import type { ReactElement } from "react";
import type { EmailChrome } from "@/emails/_components/chrome";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { emailChrome } from "@/lib/email/chrome";
import { sendEmail } from "@/lib/email/send";
import { Prisma } from "@/lib/generated/prisma/client";
import type { PushContent, PushKind } from "@/lib/push/payload";
import { deliverPush } from "@/lib/push/send";
import { appUrl } from "@/lib/site";
import { NOTIFICATION_KINDS, type NotificationKind } from "./kinds";
import type { EmailRecipient } from "./recipients";
import { unsubscribeToken } from "./tokens";

export interface BuiltEmail {
  readonly subject: string;
  readonly react: ReactElement;
  readonly text: string;
}

interface EmailDelivery<K extends NotificationKind> {
  readonly kind: K;
  readonly recipient: EmailRecipient;
  readonly dedupeKey: string;
  readonly build: (chrome: EmailChrome) => BuiltEmail;
}

type PushPart<K extends NotificationKind> = K extends PushKind ? { readonly push: () => PushContent } : { readonly push?: never };

export type Delivery = { [K in NotificationKind]: EmailDelivery<K> & PushPart<K> }[NotificationKind];

const SKIPPED_KIND = "skipped";

async function reserve(personId: string, kind: string, dedupeKey: string): Promise<boolean> {
  try {
    await db.emailLog.create({ data: { personId, kind, dedupeKey } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

async function sendPush(delivery: Delivery): Promise<boolean> {
  if (!delivery.push) return false;
  const content = delivery.push;
  const kind = delivery.kind as PushKind;
  try {
    return await deliverPush({
      kind,
      personId: delivery.recipient.personId,
      dedupeKey: delivery.dedupeKey,
      payload: () => {
        const { title, body, path, tag, action } = content();
        return { kind, title, body, url: path, tag, action };
      },
    });
  } catch (error) {
    console.error(`[push] ${kind} failed`, error);
    return false;
  }
}

export async function deliver(delivery: Delivery): Promise<boolean> {
  const [emailed, pushed] = await Promise.all([sendEmailDelivery(delivery), sendPush(delivery)]);
  return emailed || pushed;
}

async function sendEmailDelivery(delivery: Delivery): Promise<boolean> {
  const { kind, recipient, dedupeKey, build } = delivery;
  if (!(await reserve(recipient.personId, kind, dedupeKey))) return false;
  const category = NOTIFICATION_KINDS[kind];
  const token = category ? unsubscribeToken({ personId: recipient.personId, category }) : null;
  const built = build(emailChrome(token));
  try {
    await sendEmail({
      to: recipient.email,
      subject: built.subject,
      react: built.react,
      text: built.text,
      idempotencyKey: dedupeKey,
      headers: token
        ? {
            "List-Unsubscribe": `<${appUrl(routes.unsubscribeApi(token))}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    return true;
  } catch (error) {
    console.error(`[notify] ${kind} failed`, error);
    await db.emailLog.delete({ where: { dedupeKey } }).catch(() => undefined);
    return false;
  }
}

export async function markSkipped(personId: string, dedupeKey: string): Promise<void> {
  await reserve(personId, SKIPPED_KIND, dedupeKey);
}

export async function deliverAll(deliveries: readonly Delivery[]): Promise<number> {
  const results = await Promise.all(deliveries.map(deliver));
  return results.filter(Boolean).length;
}
