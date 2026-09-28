import { Section, Text } from "react-email";
import { EmailShell, emailTokens } from "./_components/email-shell";

export interface ResetCodeEmailProps {
  email: string;
  code: string;
  expiresInMinutes: number;
}

export function resetCodeSubject(code: string): string {
  return `${code} is your Bruno reset code`;
}

export function resetCodeText({ email, code, expiresInMinutes }: ResetCodeEmailProps): string {
  return `Your Bruno password reset code for ${email} is ${code}.\nIt expires in ${expiresInMinutes} minutes. Never share this code — Bruno will never ask for it.\nDidn't ask to reset? Ignore this email — your password stays the same until the code is used.`;
}

export default function ResetCodeEmail({ email, code, expiresInMinutes }: ResetCodeEmailProps) {
  return (
    <EmailShell preview={`${code} is your code to reset your Bruno password`} title="Reset your password">
      <Text
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          lineHeight: "22px",
          color: emailTokens.text2,
        }}
      >
        Enter this code in Bruno to choose a new password for {email}.
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
        Expires in {expiresInMinutes} minutes. For your security, never share this code — Bruno will never ask for
        it.
      </Text>
      <Section
        style={{
          marginTop: 24,
          backgroundColor: emailTokens.surface,
          borderRadius: 14,
          padding: "16px 20px",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: "20px",
            color: emailTokens.text2,
          }}
        >
          Didn&apos;t ask to reset? Ignore this email — your password stays the same until the code is used.
        </Text>
      </Section>
    </EmailShell>
  );
}

ResetCodeEmail.PreviewProps = {
  email: "sam@okafor.co",
  code: "730158",
  expiresInMinutes: 10,
} satisfies ResetCodeEmailProps;
