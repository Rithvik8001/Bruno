import { Card, Chip, CtaButton, Gap, Lead, Note, Rows, Title } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";
import type { EmailTint } from "./_components/tokens";

export interface ClaimReminderItem {
  name: string;
  price: string;
  category: { label: string; tint: EmailTint } | null;
}

export interface ClaimReminderEmailProps {
  senderName: string;
  billTitle: string;
  groupName: string;
  claimedPeople: number;
  totalPeople: number;
  unclaimed: ClaimReminderItem[];
  claimUrl: string;
  chrome: EmailChrome;
}

export const claimReminderSubject = ({ senderName, billTitle }: Pick<ClaimReminderEmailProps, "senderName" | "billTitle">) =>
  `${senderName} is waiting on you — claim your ${billTitle} items`;

const progressLine = ({ senderName, claimedPeople, totalPeople }: ClaimReminderEmailProps) =>
  `${senderName} added the receipt. ${claimedPeople} of ${totalPeople} people have claimed, and the bill can’t be split until everyone’s claimed.`;

const leftover = (senderName: string) => `Anything left unclaimed is split evenly when ${senderName} finishes the bill.`;

export function claimReminderText(props: ClaimReminderEmailProps): string {
  const items = props.unclaimed.map((item) => `- ${item.name} · ${item.price}`).join("\n");
  return [
    `Tap what you had at ${props.billTitle}.`,
    progressLine(props),
    items ? `Still unclaimed:\n${items}` : "",
    `Claim my items: ${props.claimUrl}`,
    leftover(props.senderName),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function ClaimReminderEmail(props: ClaimReminderEmailProps) {
  const { senderName, billTitle, groupName, unclaimed, claimUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${unclaimed.length} ${unclaimed.length === 1 ? "item" : "items"} still unclaimed on the ${billTitle} bill. It takes about 20 seconds.`}
      chrome={chrome}
      reason={`You’re a member of the group “${groupName}” on Bruno.`}
    >
      <Chip tint="orange">Claiming</Chip>
      <Gap size={16} />
      <Title>Tap what you had at {billTitle}</Title>
      <Gap size={12} />
      <Lead>{progressLine(props)}</Lead>
      <Gap size={28} />
      {unclaimed.length > 0 && (
        <>
          <Card label="Still unclaimed">
            <Rows
              rows={unclaimed.map((item) => ({
                label: item.name,
                value: item.price,
                chip: item.category ?? undefined,
              }))}
            />
          </Card>
          <Gap size={28} />
        </>
      )}
      <CtaButton href={claimUrl}>Claim my items</CtaButton>
      <Gap size={16} />
      <Note>{leftover(senderName)}</Note>
    </EmailShell>
  );
}

ClaimReminderEmail.PreviewProps = {
  senderName: "Sam",
  billTitle: "Lupa",
  groupName: "Friends",
  claimedPeople: 3,
  totalPeople: 5,
  unclaimed: [
    { name: "Negroni × 2", price: "$28.00", category: { label: "Drinks", tint: "pink" } },
    { name: "Cacio e pepe", price: "$24.00", category: { label: "Main", tint: "orange" } },
    { name: "Tiramisu", price: "$12.00", category: { label: "Dessert", tint: "violet" } },
    { name: "Sparkling water", price: "$7.00", category: null },
  ],
  claimUrl: "http://localhost:3000/b/abcdefgh2345",
  chrome: previewChrome,
} satisfies ClaimReminderEmailProps;
