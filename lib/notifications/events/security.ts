import "server-only";
import { createHash } from "node:crypto";
import NewSignInEmail, { newSignInSubject, newSignInText } from "@/emails/new-sign-in";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { personId } from "@/lib/domain/ids";
import { Prisma } from "@/lib/generated/prisma/client";
import { describeDevice } from "@/lib/security/device";
import { appUrl } from "@/lib/site";
import { deliver } from "../deliver";
import { emailMoment } from "../format";
import { lockToken } from "../tokens";

export interface SignInFacts {
  readonly userId: string;
  readonly userAgent: string | null;
  readonly ip: string | null;
  readonly city: string | null;
  readonly region: string | null;
}

async function rememberDevice(userId: string, fingerprint: string): Promise<boolean> {
  try {
    await db.knownDevice.create({ data: { userId, fingerprint } });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    await db.knownDevice.updateMany({ where: { userId, fingerprint }, data: { lastSeenAt: new Date() } });
    return false;
  }
}

export async function recordSignIn({ userId, userAgent, ip, city, region }: SignInFacts): Promise<void> {
  const device = describeDevice(userAgent);
  const fingerprint = createHash("sha256").update(`${device.browser}|${device.os}`).digest("hex");
  const knownBefore = await db.knownDevice.count({ where: { userId } });
  const isNew = await rememberDevice(userId, fingerprint);
  if (!isNew || knownBefore === 0) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, person: { select: { id: true, displayName: true, timeZone: true } } },
  });
  if (!user?.person || !user.emailVerified) return;
  const { person } = user;
  const props = {
    email: user.email,
    device: device.label,
    deviceShort: device.os,
    location: [city, region].filter(Boolean).join(", ") || null,
    ip,
    time: emailMoment(new Date(), person.timeZone),
    lockUrl: appUrl(routes.secure(lockToken({ userId }))),
  };
  await deliver({
    kind: "newSignIn",
    recipient: { personId: personId(person.id), email: user.email, displayName: person.displayName, timeZone: person.timeZone },
    dedupeKey: `sign-in/${userId}/${fingerprint}`,
    build: (chrome) => ({
      subject: newSignInSubject,
      react: NewSignInEmail({ ...props, chrome }),
      text: newSignInText({ ...props, chrome }),
    }),
  });
}
