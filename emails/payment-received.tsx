import { AmountPill, Card, Chip, CtaButton, Gap, Note, Rows, Title } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface PaymentReceivedEmailProps {
  fromName: string;
  amount: string;
  groupName: string;
  method: string;
  date: string;
  confirmsOn: string | null;
  actionUrl: string;
  chrome: EmailChrome;
}

const headline = ({ fromName, confirmsOn }: Pick<PaymentReceivedEmailProps, "fromName" | "confirmsOn">) =>
  confirmsOn ? `${fromName} says they paid you` : `${fromName} paid you back`;

export const paymentReceivedSubject = ({ fromName, amount, confirmsOn }: Pick<PaymentReceivedEmailProps, "fromName" | "amount" | "confirmsOn">) =>
  confirmsOn ? `${fromName} says they paid you ${amount}` : `${fromName} paid you ${amount}`;

const pendingNote = (confirmsOn: string) =>
  `Didn’t get it? Open Bruno and say so. Otherwise this confirms itself on ${confirmsOn}.`;

export function paymentReceivedText(props: PaymentReceivedEmailProps): string {
  return [
    `${headline(props)}.`,
    `${props.amount} · ${props.groupName} · via ${props.method} · ${props.date}`,
    props.confirmsOn ? pendingNote(props.confirmsOn) : "",
    `${props.confirmsOn ? "Confirm the payment" : "View balances"}: ${props.actionUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function PaymentReceivedEmail(props: PaymentReceivedEmailProps) {
  const { fromName, amount, groupName, method, date, confirmsOn, actionUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${amount} from ${fromName} in ${groupName}${confirmsOn ? ". Confirm it when it lands." : "."}`}
      chrome={chrome}
      reason="You received this because a payment to you was recorded."
    >
      <Chip tint={confirmsOn ? "amber" : "green"}>{confirmsOn ? "To confirm" : "Paid"}</Chip>
      <Gap size={16} />
      <Title>{headline(props)}</Title>
      <Gap size={24} />
      <AmountPill tint="green" label={confirmsOn ? "Recorded" : "Received"}>
        +{amount}
      </AmountPill>
      <Gap size={28} />
      <Card>
        <Rows
          rows={[
            { label: "From", value: fromName },
            { label: "For", value: groupName },
            { label: "Via", value: method },
            { label: "Date", value: date },
          ]}
        />
      </Card>
      <Gap size={28} />
      <CtaButton href={actionUrl}>{confirmsOn ? "Confirm payment" : "View balances"}</CtaButton>
      {confirmsOn && (
        <>
          <Gap size={16} />
          <Note>{pendingNote(confirmsOn)}</Note>
        </>
      )}
    </EmailShell>
  );
}

PaymentReceivedEmail.PreviewProps = {
  fromName: "Sam",
  amount: "$52.40",
  groupName: "Friends",
  method: "Venmo",
  date: "28 Sep, 21:41",
  confirmsOn: "1 Oct",
  actionUrl: "http://localhost:3000/groups/preview/settle/preview",
  chrome: previewChrome,
} satisfies PaymentReceivedEmailProps;
