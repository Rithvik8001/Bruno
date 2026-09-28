import "server-only";
import ExistingAccountEmail, { existingAccountSubject, existingAccountText } from "@/emails/existing-account";
import VerifyCodeEmail, { verifyCodeSubject, verifyCodeText } from "@/emails/verify-code";
import { sendEmail } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { otpExpiresInMinutes, routes } from "./rules";

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  const props = { code, expiresInMinutes: otpExpiresInMinutes };
  await sendEmail({
    to: email,
    subject: verifyCodeSubject(code),
    react: VerifyCodeEmail(props),
    text: verifyCodeText(props),
    idempotencyKey: `verify-code/${email}/${code}`,
  });
}

export async function sendExistingAccountNotice(email: string): Promise<void> {
  const props = { signInUrl: new URL(routes.signIn, serverEnv().BETTER_AUTH_URL).toString() };
  await sendEmail({
    to: email,
    subject: existingAccountSubject,
    react: ExistingAccountEmail(props),
    text: existingAccountText(props),
    idempotencyKey: `existing-account/${email}/${new Date().toISOString().slice(0, 13)}`,
  });
}
