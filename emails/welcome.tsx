import { CtaButton, Gap, Lead, Steps, Title, type StepItem } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface WelcomeEmailProps {
  name: string;
  scanUrl: string;
  chrome: EmailChrome;
}

const steps = [
  { title: "Scan a receipt", body: "Bruno reads every line — tax and tip included.", tint: "violet" },
  { title: "Share the link", body: "Friends claim their items live. No app needed.", tint: "pink" },
  { title: "Settle up", body: "See exactly who owes what, and tick it off when it’s paid.", tint: "green" },
] as const satisfies readonly StepItem[];

const intro = "Snap the receipt, everyone taps what they had, Bruno does the maths. Here’s how your first bill goes:";

export const welcomeSubject = (name: string) => `Welcome to Bruno, ${name}`;

export function welcomeText({ name, scanUrl }: WelcomeEmailProps): string {
  return [
    `Welcome to Bruno, ${name}.`,
    intro,
    steps.map((step, index) => `${index + 1}. ${step.title} — ${step.body}`).join("\n"),
    `Scan your first receipt: ${scanUrl}`,
  ].join("\n\n");
}

export default function WelcomeEmail({ name, scanUrl, chrome }: WelcomeEmailProps) {
  return (
    <EmailShell
      preview="Three steps to your first fair split — scan, share, settle."
      chrome={chrome}
      reason="You received this because you created a Bruno account."
    >
      <Title>Welcome to Bruno, {name}</Title>
      <Gap size={12} />
      <Lead>{intro}</Lead>
      <Gap size={28} />
      <Steps steps={steps} />
      <Gap size={32} />
      <CtaButton href={scanUrl}>Scan your first receipt</CtaButton>
    </EmailShell>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex",
  scanUrl: "http://localhost:3000/bills/new",
  chrome: previewChromeRequired,
} satisfies WelcomeEmailProps;
