import { Section, Text } from "react-email";
import { EmailShell, emailTokens } from "./_components/email-shell";

export interface VerifyCodeEmailProps {
  code: string;
  expiresInMinutes: number;
}

export function verifyCodeSubject(code: string): string {
  return `${code} is your Bruno code`;
}

export function verifyCodeText({
  code,
  expiresInMinutes,
}: VerifyCodeEmailProps): string {
  return `Your Bruno verification code is ${code}.\nIt expires in ${expiresInMinutes} minutes.\nIf you didn't try to create a Bruno account, you can ignore this email.`;
}

export default function VerifyCodeEmail({
  code,
  expiresInMinutes,
}: VerifyCodeEmailProps) {
  return (
    <EmailShell preview={`Your code is ${code}`} title="Confirm your email">
      <Text
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          lineHeight: "22px",
          color: emailTokens.text2,
        }}
      >
        Enter this code in Bruno to finish creating your account.
      </Text>
      <Section
        style={{
          backgroundColor: emailTokens.surface,
          borderRadius: 14,
          padding: "20px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 600,
            letterSpacing: "0.3em",
          }}
        >
          {code}
        </Text>
      </Section>
      <Text
        style={{
          margin: "16px 0 0",
          fontSize: 13,
          lineHeight: "18px",
          color: emailTokens.muted,
        }}
      >
        This code expires in {expiresInMinutes} minutes. If you didn&apos;t try
        to create a Bruno account, you can ignore this email.
      </Text>
    </EmailShell>
  );
}

VerifyCodeEmail.PreviewProps = {
  code: "482913",
  expiresInMinutes: 10,
} satisfies VerifyCodeEmailProps;
