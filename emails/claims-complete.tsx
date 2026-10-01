import { Card, Chip, CtaButton, Gap, Lead, Rows, Title } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface ClaimsCompleteEmailProps {
  billTitle: string;
  groupName: string;
  total: string;
  claimedPeople: number;
  finishUrl: string;
  chrome: EmailChrome;
}

export const claimsCompleteSubject = (billTitle: string) => `Everyone’s claimed on ${billTitle}`;

const intro = "Every item has someone on it. Finish the bill to lock in the split.";

export function claimsCompleteText(props: ClaimsCompleteEmailProps): string {
  return [`Everyone’s claimed on ${props.billTitle}.`, intro, `Finish the bill: ${props.finishUrl}`].join("\n\n");
}

export default function ClaimsCompleteEmail({ billTitle, groupName, total, claimedPeople, finishUrl, chrome }: ClaimsCompleteEmailProps) {
  return (
    <EmailShell
      preview={`${billTitle} is ready to finish — every item has been claimed.`}
      chrome={chrome}
      reason={`You opened this bill for claiming in “${groupName}”.`}
    >
      <Chip tint="green">Ready</Chip>
      <Gap size={16} />
      <Title>Everyone’s claimed on {billTitle}</Title>
      <Gap size={12} />
      <Lead>{intro}</Lead>
      <Gap size={28} />
      <Card>
        <Rows
          rows={[
            { label: "Receipt", value: billTitle },
            { label: "Total", value: total, strong: true },
            { label: "People claimed", value: String(claimedPeople) },
          ]}
        />
      </Card>
      <Gap size={28} />
      <CtaButton href={finishUrl}>Finish the bill</CtaButton>
    </EmailShell>
  );
}

ClaimsCompleteEmail.PreviewProps = {
  billTitle: "Lupa",
  groupName: "Friends",
  total: "$186.40",
  claimedPeople: 5,
  finishUrl: "http://localhost:3000/b/abcdefgh2345",
  chrome: previewChrome,
} satisfies ClaimsCompleteEmailProps;
