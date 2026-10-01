import "server-only";
import { randomInt } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { username } from "better-auth/plugins/username";
import { db } from "@/lib/db";
import { recordSignIn } from "@/lib/notifications/events/security";
import { ensurePersonForUser } from "@/lib/people/person";
import { serverEnv } from "@/lib/env";
import { runInBackground } from "@/lib/background";
import { sendExistingAccountNotice, sendPasswordResetCode, sendVerificationCode } from "./emails";
import { authRules } from "./rules";
import { isValidUsername, slugifyUsername, usernameCandidates } from "./username";

async function generateUniqueUsername(source: string): Promise<string> {
  const randomSuffix = () => String(randomInt(1000, 10000));
  for (const candidate of usernameCandidates(slugifyUsername(source), randomSuffix)) {
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error("Unreachable: username candidates are infinite");
}

function googleProvider() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = serverEnv();
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return {};
  return {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      prompt: "select_account" as const,
    },
  };
}

function geoHeader(headers: Headers | null, name: string): string | null {
  const raw = headers?.get(name);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const env = serverEnv();

export const auth = betterAuth({
  appName: "Bruno",
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: authRules.password.min,
    maxPasswordLength: authRules.password.max,
    revokeSessionsOnPasswordReset: false,
    onExistingUserSignUp: async ({ user }) => {
      runInBackground("existing-account notice", () => sendExistingAccountNotice(user.email));
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
  },
  socialProviders: googleProvider(),
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/email": { window: 60, max: 5 },
      "/is-username-available": { window: 60, max: 30 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/request-password-reset": { window: 60, max: 3 },
      "/email-otp/check-verification-otp": { window: 60, max: 10 },
      "/email-otp/reset-password": { window: 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session, context) => {
          const headers = context?.request?.headers ?? null;
          const facts = {
            userId: session.userId,
            userAgent: session.userAgent ?? null,
            ip: session.ipAddress ?? null,
            city: geoHeader(headers, "x-vercel-ip-city"),
            region: geoHeader(headers, "x-vercel-ip-country-region"),
          };
          runInBackground("sign-in alert", () => recordSignIn(facts));
        },
      },
    },
    user: {
      create: {
        before: async (user) => {
          const existing = "username" in user ? user.username : undefined;
          if (typeof existing === "string" && isValidUsername(existing)) return;
          const generated = await generateUniqueUsername(user.email.split("@")[0] ?? user.name);
          return { data: { ...user, username: generated, displayUsername: generated } };
        },
        after: async (user) => {
          runInBackground("person", async () => {
            await ensurePersonForUser(user);
          });
        },
      },
    },
  },
  plugins: [
    username({
      minUsernameLength: authRules.username.min,
      maxUsernameLength: authRules.username.max,
      usernameValidator: (value) => authRules.username.pattern.test(value),
    }),
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: authRules.otp.length,
      expiresIn: authRules.otp.expiresInSeconds,
      allowedAttempts: authRules.otp.allowedAttempts,
      storeOTP: "hashed",
      sendVerificationOTP: async ({ email, otp, type }) => {
        switch (type) {
          case "email-verification":
            runInBackground("verification code", () => sendVerificationCode(email, otp));
            return;
          case "forget-password":
            runInBackground("password reset code", () => sendPasswordResetCode(email, otp));
            return;
          default:
            return;
        }
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
