import { AmountPill, Card, Chip, CtaButton, Gap, Rows, Title } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export type BillAddedVariant = "added" | "split";
export type BillAddedStake = "owes" | "owed";

export interface BillAddedEmailProps {
  variant: BillAddedVariant;
  stake: BillAddedStake;
  actorName: string;
  billTitle: string;
  groupName: string;
  amount: string;
  total: string;
  payerName: string;
  date: string;
  billUrl: string;
  chrome: EmailChrome;
}

const copy = {
  added: { chip: "New bill", tint: "violet" },
  split: { chip: "Split", tint: "green" },
} as const satisfies Record<BillAddedVariant, { chip: string; tint: "violet" | "green" }>;

const stakeCopy = {
  owes: { label: "Your share", tint: "red" },
  owed: { label: "You get back", tint: "green" },
} as const satisfies Record<BillAddedStake, { label: string; tint: "red" | "green" }>;

const headline = ({ variant, actorName, billTitle }: Pick<BillAddedEmailProps, "variant" | "actorName" | "billTitle">) =>
  variant === "added" ? `${actorName} added ${billTitle}` : `${billTitle} is split`;

export const billAddedSubject = (props: Pick<BillAddedEmailProps, "variant" | "stake" | "actorName" | "billTitle" | "amount">) =>
  `${headline(props)} · ${stakeCopy[props.stake].label.toLowerCase()} ${props.amount}`;

export function billAddedText(props: BillAddedEmailProps): string {
  return [
    `${headline(props)}.`,
    `${stakeCopy[props.stake].label}: ${props.amount}`,
    `Paid by ${props.payerName} · Total ${props.total} · ${props.groupName} · ${props.date}`,
    `View the bill: ${props.billUrl}`,
  ].join("\n\n");
}

export default function BillAddedEmail(props: BillAddedEmailProps) {
  const { variant, stake, billTitle, groupName, amount, total, payerName, date, billUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${stakeCopy[stake].label} ${amount} · paid by ${payerName} in ${groupName}.`}
      chrome={chrome}
      reason={`You’re a member of the group “${groupName}” on Bruno.`}
    >
      <Chip tint={copy[variant].tint}>{copy[variant].chip}</Chip>
      <Gap size={16} />
      <Title>{headline(props)}</Title>
      <Gap size={24} />
      <AmountPill tint={stakeCopy[stake].tint} label={stakeCopy[stake].label}>
        {amount}
      </AmountPill>
      <Gap size={28} />
      <Card>
        <Rows
          rows={[
            { label: "Receipt", value: billTitle },
            { label: "Paid by", value: payerName },
            { label: "Total", value: total, strong: true },
            { label: "Group", value: groupName },
            { label: "Date", value: date },
          ]}
        />
      </Card>
      <Gap size={28} />
      <CtaButton href={billUrl}>View the bill</CtaButton>
    </EmailShell>
  );
}

BillAddedEmail.PreviewProps = {
  variant: "added",
  stake: "owes",
  actorName: "Sam",
  billTitle: "Lupa",
  groupName: "Friends",
  amount: "$37.28",
  total: "$186.40",
  payerName: "Sam",
  date: "28 Sep",
  billUrl: "http://localhost:3000/bills/lupa-7k2",
  chrome: previewChrome,
} satisfies BillAddedEmailProps;
