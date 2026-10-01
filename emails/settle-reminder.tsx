import { AmountPill, Card, CtaButton, Gap, Note, Rows, TextLink, Title, type DetailRow } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface SettleReminderLine {
  label: string;
  amount: string;
}

export interface SettleReminderEmailProps {
  creditors: SettleReminderLine[];
  bills: SettleReminderLine[];
  total: string;
  settleUrl: string;
  sender?: string | null;
  chrome: EmailChrome;
}

const single = (props: Pick<SettleReminderEmailProps, "creditors">) => (props.creditors.length === 1 ? props.creditors[0] : undefined);

export function settleReminderSubject(props: Pick<SettleReminderEmailProps, "creditors" | "total" | "sender">): string {
  const only = single(props);
  if (props.sender) return `Reminder from ${props.sender}: you owe ${props.total}`;
  return only ? `You owe ${only.label} ${props.total}` : `You owe ${props.creditors.length} people ${props.total}`;
}

const headline = (props: Pick<SettleReminderEmailProps, "creditors">) => {
  const only = single(props);
  return only ? `Ready to settle with ${only.label}?` : "Ready to settle up?";
};

function breakdown(props: SettleReminderEmailProps): { label: string; rows: DetailRow[] } {
  const lines = single(props) ? props.bills : props.creditors;
  return {
    label: single(props) ? "How we got here" : "Who you owe",
    rows: [
      ...lines.map((line) => ({ label: line.label, value: line.amount })),
      { label: "Total", value: props.total, strong: true },
    ],
  };
}

const reason = (props: Pick<SettleReminderEmailProps, "creditors" | "sender">) => {
  const only = single(props);
  if (props.sender) return `${props.sender} asked Bruno to send you this reminder.`;
  return `Reminders for open balances are sent weekly. ${only ? only.label : "Your friends"} didn’t send this — Bruno did.`;
};

export function settleReminderText(props: SettleReminderEmailProps): string {
  const { label, rows } = breakdown(props);
  return [
    headline(props),
    `You owe ${props.total}.`,
    `${label}:\n${rows.map((row) => `- ${row.label}: ${row.value}`).join("\n")}`,
    `Settle up: ${props.settleUrl}`,
    reason(props),
  ].join("\n\n");
}

export default function SettleReminderEmail(props: SettleReminderEmailProps) {
  const { total, settleUrl, chrome } = props;
  const { label, rows } = breakdown(props);
  return (
    <EmailShell
      preview={`${settleReminderSubject(props)}. Whenever you’re ready.`}
      chrome={chrome}
      reason={reason(props)}
    >
      <Title>{headline(props)}</Title>
      <Gap size={24} />
      <AmountPill tint="red" label="You owe">
        {total}
      </AmountPill>
      <Gap size={28} />
      <Card label={label}>
        <Rows rows={rows} />
      </Card>
      <Gap size={28} />
      <CtaButton href={settleUrl}>Settle up</CtaButton>
      <Gap size={16} />
      <Note>
        Already paid outside Bruno? <TextLink href={settleUrl}>Mark as paid</TextLink>
      </Note>
    </EmailShell>
  );
}

SettleReminderEmail.PreviewProps = {
  creditors: [{ label: "Priya", amount: "$23.60" }],
  bills: [
    { label: "Pastéis de Belém · Lisbon trip", amount: "$14.20" },
    { label: "Uber to Alfama · Lisbon trip", amount: "$9.40" },
  ],
  total: "$23.60",
  settleUrl: "http://localhost:3000/groups/preview/settle/preview",
  chrome: previewChrome,
} satisfies SettleReminderEmailProps;
