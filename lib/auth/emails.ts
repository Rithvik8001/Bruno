import "server-only";
import ExistingAccountEmail, { existingAccountSubject, existingAccountText } from "@/emails/existing-account";
import ResetCodeEmail, { resetCodeSubject, resetCodeText } from "@/emails/reset-code";
import VerifyCodeEmail, { verifyCodeSubject, verifyCodeText } from "@/emails/verify-code";
import { sendEmail } from "@/lib/email/send";
import { appUrl } from "@/lib/site";
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

export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  const props = { email, code, expiresInMinutes: otpExpiresInMinutes };
  await sendEmail({
    to: email,
    subject: resetCodeSubject(code),
    react: ResetCodeEmail(props),
    text: resetCodeText(props),
    idempotencyKey: `reset-code/${email}/${code}`,
  });
}

export async function sendExistingAccountNotice(email: string): Promise<void> {
  const props = { signInUrl: appUrl(routes.signIn) };
  await sendEmail({
    to: email,
    subject: existingAccountSubject,
    react: ExistingAccountEmail(props),
    text: existingAccountText(props),
    idempotencyKey: `existing-account/${email}/${new Date().toISOString().slice(0, 13)}`,
  });
}
