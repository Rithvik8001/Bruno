import "server-only";
import { randomInt } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { username } from "better-auth/plugins/username";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { runInBackground } from "./background";
import { sendExistingAccountNotice, sendVerificationCode } from "./emails";
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
    revokeSessionsOnPasswordReset: true,
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
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const existing = "username" in user ? user.username : undefined;
          if (typeof existing === "string" && isValidUsername(existing)) return;
          const generated = await generateUniqueUsername(user.email.split("@")[0] ?? user.name);
          return { data: { ...user, username: generated, displayUsername: generated } };
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
        if (type !== "email-verification") return;
        runInBackground("verification code", () => sendVerificationCode(email, otp));
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
