import { Card, CodeTiles, Gap, Lead, Note, Title } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";
import { emailColors, emailFont } from "./_components/tokens";

export interface VerifyCodeEmailProps {
  email: string;
  code: string;
  expiresInMinutes: number;
  chrome: EmailChrome;
}

export function verifyCodeSubject(code: string): string {
  return `${code} is your Bruno code`;
}

export function verifyCodeText({ code, expiresInMinutes }: VerifyCodeEmailProps): string {
  return `Your Bruno verification code is ${code}.\nIt expires in ${expiresInMinutes} minutes. Never share this code — Bruno will never ask for it.\nDidn't try to sign up? You can ignore this email — no account is created until the code is entered.`;
}

export default function VerifyCodeEmail({ email, code, expiresInMinutes, chrome }: VerifyCodeEmailProps) {
  return (
    <EmailShell
      preview={`${code} is your Bruno code. It expires in ${expiresInMinutes} minutes.`}
      chrome={chrome}
      reason={`You received this because someone signed up for Bruno with ${email}.`}
    >
      <Title>Confirm your email</Title>
      <Gap size={12} />
      <Lead>Enter this code in Bruno to finish creating your account.</Lead>
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
          Didn&apos;t try to sign up? You can safely ignore this email — no account is created until the code is
          entered.
        </p>
      </Card>
    </EmailShell>
  );
}

VerifyCodeEmail.PreviewProps = {
  email: "alex@hey.com",
  code: "482913",
  expiresInMinutes: 10,
  chrome: previewChromeRequired,
} satisfies VerifyCodeEmailProps;
