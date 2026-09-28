import { Button, Text } from "react-email";
import { EmailShell, emailTokens } from "./_components/email-shell";

export interface ExistingAccountEmailProps {
  signInUrl: string;
}

export const existingAccountSubject = "You already have a Bruno account";

export function existingAccountText({
  signInUrl,
}: ExistingAccountEmailProps): string {
  return `Someone tried to create a Bruno account with this email, but you already have one.\nSign in instead: ${signInUrl}\nIf this wasn't you, you can ignore this email — nothing has changed.`;
}

export default function ExistingAccountEmail({
  signInUrl,
}: ExistingAccountEmailProps) {
  return (
    <EmailShell
      preview="Sign in instead — your account is already here."
      title="You already have an account"
    >
      <Text
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          lineHeight: "22px",
          color: emailTokens.text2,
        }}
      >
        Someone tried to create a Bruno account with this email address. You
        already have one, so there&apos;s nothing new to set up.
      </Text>
      <Button
        href={signInUrl}
        style={{
          display: "inline-block",
          backgroundColor: emailTokens.brand,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 10,
          padding: "13px 22px",
          textDecoration: "none",
        }}
      >
        Sign in to Bruno
      </Button>
      <Text
        style={{
          margin: "24px 0 0",
          fontSize: 13,
          lineHeight: "18px",
          color: emailTokens.muted,
        }}
      >
        If this wasn&apos;t you, you can ignore this email — nothing has
        changed.
      </Text>
    </EmailShell>
  );
}

ExistingAccountEmail.PreviewProps = {
  signInUrl: "http://localhost:3000/sign-in",
} satisfies ExistingAccountEmailProps;
