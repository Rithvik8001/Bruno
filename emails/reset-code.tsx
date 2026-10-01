import { Card, CodeTiles, Gap, Lead, Note, Title } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";
import { emailColors, emailFont } from "./_components/tokens";

export interface ResetCodeEmailProps {
  email: string;
  code: string;
  expiresInMinutes: number;
  chrome: EmailChrome;
}

export function resetCodeSubject(code: string): string {
  return `${code} is your Bruno reset code`;
}

export function resetCodeText({ email, code, expiresInMinutes }: ResetCodeEmailProps): string {
  return `Your Bruno password reset code for ${email} is ${code}.\nIt expires in ${expiresInMinutes} minutes. Never share this code — Bruno will never ask for it.\nDidn't ask to reset? Ignore this email — your password stays the same until the code is used.`;
}

export default function ResetCodeEmail({ email, code, expiresInMinutes, chrome }: ResetCodeEmailProps) {
  return (
    <EmailShell
      preview={`${code} is your code to reset your Bruno password. Expires in ${expiresInMinutes} minutes.`}
      chrome={chrome}
      reason={`You received this because a password reset was requested for ${email}.`}
    >
      <Title>Reset your password</Title>
      <Gap size={12} />
      <Lead>Enter this code in Bruno to choose a new password for {email}.</Lead>
      <Gap size={28} />
      <CodeTiles code={code} />
      <Gap size={20} />
      <Note>
        Expires in {expiresInMinutes} minutes. For your security, never share this code — Bruno will never ask for it.
      </Note>
      <Gap size={28} />
      <Card>
        <p
          className="e-text2"
          style={{ margin: 0, fontFamily: emailFont, fontSize: 14, lineHeight: "20px", color: emailColors.text2 }}
        >
          Didn&apos;t ask to reset? Ignore this email — your password stays the same until the code is used.
        </p>
      </Card>
    </EmailShell>
  );
}

ResetCodeEmail.PreviewProps = {
  email: "sam@okafor.co",
  code: "730158",
  expiresInMinutes: 10,
  chrome: previewChromeRequired,
} satisfies ResetCodeEmailProps;
