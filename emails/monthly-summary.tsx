import { Bars, CtaButton, Eyebrow, Gap, Heading, PersonCard, StatCards, Title, type BarItem, type EmailPerson } from "./_components/blocks";
import { previewChrome, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface MonthlyTopPerson {
  person: EmailPerson;
  name: string;
  line: string;
}

export interface MonthlySummaryEmailProps {
  month: string;
  billCount: number;
  share: string;
  settled: string;
  groupCount: number;
  groups: BarItem[];
  top: MonthlyTopPerson | null;
  activityUrl: string;
  chrome: EmailChrome;
}

export const monthlySummarySubject = (month: string) => `Your ${month} on Bruno`;

const bills = (count: number) => `${count} ${count === 1 ? "bill" : "bills"}`;
const groupsLine = ({ share, groupCount }: Pick<MonthlySummaryEmailProps, "share" | "groupCount">) =>
  `Your share was ${share} across ${groupCount} ${groupCount === 1 ? "group" : "groups"}.`;

export function monthlySummaryText(props: MonthlySummaryEmailProps): string {
  return [
    `${props.month} recap: ${bills(props.billCount)}, zero awkward maths.`,
    `${groupsLine(props)} Settled: ${props.settled}.`,
    props.groups.map((group) => `- ${group.name}: ${group.amount}`).join("\n"),
    props.top ? `Most bills with ${props.top.name}. ${props.top.line}` : "",
    `See full activity: ${props.activityUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default function MonthlySummaryEmail(props: MonthlySummaryEmailProps) {
  const { month, billCount, share, settled, groups, top, activityUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${groupsLine(props)} Here’s where it went.`}
      chrome={chrome}
      reason="You get a recap on the 1st of each month."
    >
      <Eyebrow>{month} recap</Eyebrow>
      <Title>{bills(billCount)}, zero awkward maths</Title>
      <Gap size={28} />
      <StatCards left={{ label: "Your share", value: share }} right={{ label: "Settled", value: settled, tint: "green" }} />
      <Gap size={28} />
      <Heading>Where it went</Heading>
      <Bars items={groups} />
      {top && (
        <>
          <Gap size={32} />
          <PersonCard person={top.person} title={`Most bills with ${top.name}`} body={top.line} />
        </>
      )}
      <Gap size={28} />
      <CtaButton href={activityUrl}>See full activity</CtaButton>
    </EmailShell>
  );
}

MonthlySummaryEmail.PreviewProps = {
  month: "September",
  billCount: 11,
  share: "$412.70",
  settled: "$286.30",
  groupCount: 3,
  groups: [
    { name: "Lisbon trip", amount: "$238.10", tint: "indigo", percent: 100 },
    { name: "Friends", amount: "$121.40", tint: "pink", percent: 51 },
    { name: "Flat 4B", amount: "$53.20", tint: "cyan", percent: 22 },
  ],
  top: { person: { initials: "PR", tint: "cyan" }, name: "Priya", line: "6 bills together. You’re $8.10 away from even." },
  activityUrl: "http://localhost:3000/activity",
  chrome: previewChrome,
} satisfies MonthlySummaryEmailProps;
