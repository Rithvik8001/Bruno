import { Card, Chip, CtaButton, Gap, Lead, Note, Rows, Title, type DetailRow } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface NewSignInEmailProps {
  email: string;
  device: string;
  deviceShort: string;
  location: string | null;
  ip: string | null;
  time: string;
  lockUrl: string;
  chrome: EmailChrome;
}

export const newSignInSubject = "New sign-in to your Bruno account";

function details({ device, location, ip, time }: NewSignInEmailProps): DetailRow[] {
  return [
    { label: "Device", value: device },
    ...(location ? [{ label: "Location", value: location }] : []),
    ...(ip ? [{ label: "IP address", value: ip }] : []),
    { label: "Time", value: time },
  ];
}

export function newSignInText(props: NewSignInEmailProps): string {
  return [
    `New sign-in on ${props.deviceShort}.`,
    "Your account was just accessed from a device we haven't seen before. If this was you, there's nothing to do.",
    details(props)
      .map((row) => `${row.label}: ${row.value}`)
      .join("\n"),
    `This wasn't me: ${props.lockUrl}`,
    "We'll sign out every device and help you set a new password.",
  ].join("\n\n");
}

export default function NewSignInEmail(props: NewSignInEmailProps) {
  const { email, device, deviceShort, location, time, lockUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${[device, location, time].filter(Boolean).join(" · ")}. Not you? Lock your account.`}
      chrome={chrome}
      reason={`Security alerts are always sent to ${email}.`}
    >
      <Chip tint="amber">New device</Chip>
      <Gap size={16} />
      <Title>New sign-in on {deviceShort}</Title>
      <Gap size={12} />
      <Lead>
        Your account was just accessed from a device we haven&apos;t seen before. If this was you, there&apos;s nothing
        to do.
      </Lead>
      <Gap size={28} />
      <Card>
        <Rows rows={details(props)} />
      </Card>
      <Gap size={28} />
      <CtaButton href={lockUrl}>This wasn’t me</CtaButton>
      <Gap size={16} />
      <Note>We’ll sign out every device and help you set a new password.</Note>
    </EmailShell>
  );
}

NewSignInEmail.PreviewProps = {
  email: "alex@hey.com",
  device: "Safari on iPhone",
  deviceShort: "iPhone",
  location: "Austin, TX",
  ip: "72.14.201.8",
  time: "28 Sep, 21:41 UTC",
  lockUrl: "http://localhost:3000/secure/preview",
  chrome: previewChromeRequired,
} satisfies NewSignInEmailProps;
