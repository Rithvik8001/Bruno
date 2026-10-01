import { AvatarStack, Card, Chip, CtaButton, Gap, Lead, Note, Rows, Title, type EmailPerson } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface ClaimInviteEmailProps {
  senderName: string;
  billTitle: string;
  groupName: string;
  people: EmailPerson[];
  total: string;
  totalPeople: number;
  claimedPeople: number;
  claimUrl: string;
  chrome: EmailChrome;
}

export const claimInviteSubject = ({ senderName, billTitle }: Pick<ClaimInviteEmailProps, "senderName" | "billTitle">) =>
  `${senderName} invited you to ${billTitle}`;

const leftover = (senderName: string) => `Anything left unclaimed is split evenly when ${senderName} finishes the bill.`;

export function claimInviteText(props: ClaimInviteEmailProps): string {
  return [
    `${props.senderName} invited you to split a bill.`,
    `Join ${props.billTitle} to claim what you had. You don't need the app — it opens in your browser.`,
    `Total: ${props.total} · ${props.claimedPeople} of ${props.totalPeople} people have claimed`,
    `Claim my items: ${props.claimUrl}`,
    leftover(props.senderName),
  ].join("\n\n");
}

export default function ClaimInviteEmail(props: ClaimInviteEmailProps) {
  const { senderName, billTitle, groupName, people, total, totalPeople, claimedPeople, claimUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${senderName} added ${billTitle} — claim your items in a few taps.`}
      chrome={chrome}
      reason={`You’re a member of the group “${groupName}” on Bruno.`}
    >
      {people.length > 0 && (
        <>
          <AvatarStack people={people} />
          <Gap size={20} />
        </>
      )}
      <Title>{senderName} invited you to split a bill</Title>
      <Gap size={12} />
      <Lead>
        Join <Chip tint="indigo">{billTitle}</Chip> to claim what you had. You don’t need the app — it opens in your
        browser.
      </Lead>
      <Gap size={28} />
      <Card>
        <Rows
          rows={[
            { label: "Receipt", value: billTitle },
            { label: "Total", value: total, strong: true },
            { label: "People", value: String(totalPeople) },
            { label: "Claimed", value: `${claimedPeople} of ${totalPeople}` },
          ]}
        />
      </Card>
      <Gap size={28} />
      <CtaButton href={claimUrl}>Claim my items</CtaButton>
      <Gap size={16} />
      <Note>{leftover(senderName)}</Note>
    </EmailShell>
  );
}

ClaimInviteEmail.PreviewProps = {
  senderName: "Sam",
  billTitle: "Lupa tonight",
  groupName: "Friends",
  people: [
    { initials: "SO", tint: "pink" },
    { initials: "PR", tint: "cyan" },
    { initials: "AN", tint: "orange" },
    { initials: "JM", tint: "blue" },
  ],
  total: "$186.40",
  totalPeople: 5,
  claimedPeople: 1,
  claimUrl: "http://localhost:3000/b/abcdefgh2345",
  chrome: previewChrome,
} satisfies ClaimInviteEmailProps;
