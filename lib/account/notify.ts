import "server-only";
import AccountDeletedEmail, { accountDeletedSubject, accountDeletedText } from "@/emails/account-deleted";
import { emailChrome } from "@/lib/email/chrome";
import { sendEmail } from "@/lib/email/send";

const FALLBACK_ZONE = "UTC";

function deletedAtLabel(at: Date, timeZone: string | null): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone }).format(at);
  try {
    return format(timeZone ?? FALLBACK_ZONE);
  } catch {
    return format(FALLBACK_ZONE);
  }
}

export async function sendAccountDeleted(input: { userId: string; email: string; at: Date; timeZone: string | null }): Promise<void> {
  const props = { email: input.email, deletedAt: deletedAtLabel(input.at, input.timeZone), chrome: emailChrome() };
  await sendEmail({
    to: input.email,
    subject: accountDeletedSubject,
    react: AccountDeletedEmail(props),
    text: accountDeletedText(props),
    idempotencyKey: `account-deleted/${input.userId}`,
  });
}
