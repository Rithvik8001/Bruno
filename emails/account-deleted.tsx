import { Card, Chip, Gap, Lead, Rows, Title } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface AccountDeletedEmailProps {
  email: string;
  deletedAt: string;
  chrome: EmailChrome;
}

export const accountDeletedSubject = "Your Bruno account was deleted";

const body =
  "Your profile, sign-in and settings are gone, and you've left all your groups. Bills you were part of stay for your friends, shown as Deleted member.";

export function accountDeletedText({ email, deletedAt }: AccountDeletedEmailProps): string {
  return [accountDeletedSubject, body, `Deleted on: ${deletedAt}`, `This is the last email Bruno will send to ${email}.`].join("\n\n");
}

export default function AccountDeletedEmail({ email, deletedAt, chrome }: AccountDeletedEmailProps) {
  return (
    <EmailShell preview={`Deleted on ${deletedAt}.`} chrome={chrome} reason={`This is the last email Bruno will send to ${email}.`}>
      <Chip tint="red">Account deleted</Chip>
      <Gap size={16} />
      <Title>{accountDeletedSubject}</Title>
      <Gap size={12} />
      <Lead>{body}</Lead>
      <Gap size={28} />
      <Card>
        <Rows rows={[{ label: "Deleted on", value: deletedAt, strong: true }]} />
      </Card>
    </EmailShell>
  );
}

AccountDeletedEmail.PreviewProps = {
  email: "alex@example.com",
  deletedAt: "1 Oct 2026, 14:32",
  chrome: previewChromeRequired,
} satisfies AccountDeletedEmailProps;
