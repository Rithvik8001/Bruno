import { CtaButton, Gap, Lead, Note, Title } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface ExistingAccountEmailProps {
  signInUrl: string;
  chrome: EmailChrome;
}

export const existingAccountSubject = "You already have a Bruno account";

export function existingAccountText({ signInUrl }: ExistingAccountEmailProps): string {
  return `Someone tried to create a Bruno account with this email, but you already have one.\nSign in instead: ${signInUrl}\nIf this wasn't you, you can ignore this email — nothing has changed.`;
}

export default function ExistingAccountEmail({ signInUrl, chrome }: ExistingAccountEmailProps) {
  return (
    <EmailShell
      preview="Sign in instead — your account is already here."
      chrome={chrome}
      reason="You received this because someone tried to sign up for Bruno with this email."
    >
      <Title>You already have an account</Title>
      <Gap size={12} />
      <Lead>
        Someone tried to create a Bruno account with this email address. You already have one, so there&apos;s nothing
        new to set up.
      </Lead>
      <Gap size={28} />
      <CtaButton href={signInUrl}>Sign in</CtaButton>
      <Gap size={16} />
      <Note>If this wasn&apos;t you, you can ignore this email — nothing has changed.</Note>
    </EmailShell>
  );
}

ExistingAccountEmail.PreviewProps = {
  signInUrl: "http://localhost:3000/sign-in",
  chrome: previewChromeRequired,
} satisfies ExistingAccountEmailProps;
