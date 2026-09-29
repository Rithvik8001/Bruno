import { Button, Column, Row, Section, Text } from "react-email";
import { EmailShell, emailTokens } from "./_components/email-shell";

export interface ClaimReminderItem {
  name: string;
  price: string;
}

export interface ClaimReminderEmailProps {
  senderName: string;
  billTitle: string;
  groupName: string;
  claimedPeople: number;
  totalPeople: number;
  unclaimed: ClaimReminderItem[];
  claimUrl: string;
}

export const claimReminderSubject = ({ senderName, billTitle }: Pick<ClaimReminderEmailProps, "senderName" | "billTitle">) =>
  `${senderName} is waiting on you — claim your ${billTitle} items`;

const progressLine = ({ senderName, claimedPeople, totalPeople }: ClaimReminderEmailProps) =>
  `${senderName} added the receipt. ${claimedPeople} of ${totalPeople} people have claimed, and Bruno can't settle until everyone's in.`;

export function claimReminderText(props: ClaimReminderEmailProps): string {
  const items = props.unclaimed.map((item) => `- ${item.name} · ${item.price}`).join("\n");
  return [
    `Tap what you had at ${props.billTitle}.`,
    progressLine(props),
    items ? `Still unclaimed:\n${items}` : "",
    `Claim your items: ${props.claimUrl}`,
    `You're a member of the group "${props.groupName}" on Bruno.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function ClaimReminderEmail(props: ClaimReminderEmailProps) {
  const { billTitle, groupName, unclaimed, claimUrl } = props;
  return (
    <EmailShell
      preview={`${unclaimed.length} ${unclaimed.length === 1 ? "item" : "items"} still unclaimed on the ${billTitle} bill. It takes about 20 seconds.`}
      title={`Tap what you had at ${billTitle}`}
    >
      <Text
        style={{
          display: "inline-block",
          margin: "0 0 16px",
          padding: "3px 9px",
          borderRadius: 7,
          backgroundColor: "#FFF0E0",
          color: "#A84B00",
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 600,
        }}
      >
        ● Claiming
      </Text>
      <Text style={{ margin: "0 0 28px", fontSize: 15, lineHeight: "24px", color: emailTokens.text2 }}>
        {progressLine(props)}
      </Text>
      {unclaimed.length > 0 && (
        <Section style={{ backgroundColor: emailTokens.surface, borderRadius: 20, padding: 24, margin: "0 0 28px" }}>
          <Text style={{ margin: "0 0 4px", fontSize: 13, lineHeight: "18px", fontWeight: 500, color: emailTokens.muted }}>
            STILL UNCLAIMED
          </Text>
          {unclaimed.map((item, index) => (
            <Row key={`${item.name}-${index}`}>
              <Column style={{ padding: "10px 0 0", fontSize: 14, lineHeight: "20px", color: emailTokens.text }}>
                {item.name}
              </Column>
              <Column
                align="right"
                style={{ padding: "10px 0 0", fontSize: 14, lineHeight: "20px", fontWeight: 500, color: emailTokens.text }}
              >
                {item.price}
              </Column>
            </Row>
          ))}
        </Section>
      )}
      <Button
        href={claimUrl}
        style={{
          display: "inline-block",
          backgroundColor: emailTokens.brand,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 10,
          padding: "14px 24px",
          textDecoration: "none",
        }}
      >
        Claim my items
      </Button>
      <Text style={{ margin: "24px 0 0", fontSize: 13, lineHeight: "20px", color: emailTokens.muted }}>
        You&apos;re a member of the group “{groupName}” on Bruno.
      </Text>
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
    { name: "Negroni × 2", price: "$28.00" },
    { name: "Cacio e pepe", price: "$24.00" },
    { name: "Tiramisu", price: "$12.00" },
  ],
  claimUrl: "http://localhost:3000/b/abcdefgh2345",
} satisfies ClaimReminderEmailProps;
