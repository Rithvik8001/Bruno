import { AmountPill, Card, Chip, CtaButton, Gap, Lead, Rows, Title } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";
import type { EmailTint } from "./_components/tokens";

export const PAYMENT_UPDATES = ["confirmed", "received", "declined", "cancelled"] as const;
export type PaymentUpdate = (typeof PAYMENT_UPDATES)[number];

export interface PaymentUpdateEmailProps {
  update: PaymentUpdate;
  otherName: string;
  amount: string;
  groupName: string;
  method: string;
  date: string;
  actionUrl: string;
  chrome: EmailChrome;
}

interface UpdateCopy {
  readonly chip: string;
  readonly tint: EmailTint;
  readonly pill: string;
  readonly pillTint: EmailTint;
  readonly cta: string;
  readonly title: (other: string) => string;
  readonly lead: (other: string, amount: string) => string;
  readonly reason: string;
}

const copy = {
  confirmed: {
    chip: "Confirmed",
    tint: "green",
    pill: "Paid",
    pillTint: "green",
    cta: "View balances",
    title: (other) => `${other} confirmed your payment`,
    lead: (other, amount) => `${other} got your ${amount}. It’s off your balance.`,
    reason: "You received this because a payment you recorded was confirmed.",
  },
  received: {
    chip: "Paid",
    tint: "green",
    pill: "Paid",
    pillTint: "green",
    cta: "View balances",
    title: (other) => `${other} marked your payment as received`,
    lead: (other, amount) => `${other} recorded ${amount} from you. It’s off your balance.`,
    reason: "You received this because a payment from you was recorded.",
  },
  declined: {
    chip: "Not received",
    tint: "red",
    pill: "Still owed",
    pillTint: "red",
    cta: "Settle up",
    title: (other) => `${other} didn’t get your payment`,
    lead: (other, amount) => `${other} said the ${amount} you recorded hasn’t arrived, so it’s back on your balance.`,
    reason: "You received this because a payment you recorded was declined.",
  },
  cancelled: {
    chip: "Cancelled",
    tint: "amber",
    pill: "Undone",
    pillTint: "amber",
    cta: "View balances",
    title: (other) => `${other} cancelled a payment`,
    lead: (other, amount) => `${other} undid the ${amount} payment they recorded, so your balance with them is back where it was.`,
    reason: "You received this because a payment with you was cancelled.",
  },
} as const satisfies Record<PaymentUpdate, UpdateCopy>;

export const paymentUpdateSubject = ({ update, otherName, amount }: Pick<PaymentUpdateEmailProps, "update" | "otherName" | "amount">) =>
  `${copy[update].title(otherName)} · ${amount}`;

export function paymentUpdateText(props: PaymentUpdateEmailProps): string {
  const c = copy[props.update];
  return [
    `${c.title(props.otherName)}.`,
    c.lead(props.otherName, props.amount),
    `${props.groupName} · via ${props.method} · ${props.date}`,
    `${c.cta}: ${props.actionUrl}`,
  ].join("\n\n");
}

export default function PaymentUpdateEmail({ update, otherName, amount, groupName, method, date, actionUrl, chrome }: PaymentUpdateEmailProps) {
  const c = copy[update];
  return (
    <EmailShell preview={c.lead(otherName, amount)} chrome={chrome} reason={c.reason}>
      <Chip tint={c.tint}>{c.chip}</Chip>
      <Gap size={16} />
      <Title>{c.title(otherName)}</Title>
      <Gap size={12} />
      <Lead>{c.lead(otherName, amount)}</Lead>
      <Gap size={24} />
      <AmountPill tint={c.pillTint} label={c.pill}>
        {amount}
      </AmountPill>
      <Gap size={28} />
      <Card>
        <Rows
          rows={[
            { label: "With", value: otherName },
            { label: "For", value: groupName },
            { label: "Via", value: method },
            { label: "Date", value: date },
          ]}
        />
      </Card>
      <Gap size={28} />
      <CtaButton href={actionUrl}>{c.cta}</CtaButton>
    </EmailShell>
  );
}

PaymentUpdateEmail.PreviewProps = {
  update: "declined",
  otherName: "Priya",
  amount: "$23.60",
  groupName: "Lisbon trip",
  method: "Bank transfer",
  date: "28 Sep, 21:41",
  actionUrl: "http://localhost:3000/groups/preview/settle/preview",
  chrome: previewChrome,
} satisfies PaymentUpdateEmailProps;
