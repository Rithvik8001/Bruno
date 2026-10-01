import { AvatarStack, Card, CtaButton, Gap, Lead, Rows, Title, type DetailRow, type EmailPerson } from "./_components/blocks";
import { previewChromeRequired, type EmailChrome } from "./_components/chrome";
import { EmailShell } from "./_components/shell";

export interface AddedToGroupEmailProps {
  adderName: string;
  groupName: string;
  people: EmailPerson[];
  memberCount: number;
  openBills: number;
  groupUrl: string;
  chrome: EmailChrome;
}

export const addedToGroupSubject = ({ adderName, groupName }: Pick<AddedToGroupEmailProps, "adderName" | "groupName">) =>
  `${adderName} added you to ${groupName}`;

const intro = "Bills in this group now include you. Add one, or claim what you had on the open ones.";

function details({ groupName, memberCount, openBills }: AddedToGroupEmailProps): DetailRow[] {
  return [
    { label: "Group", value: groupName },
    { label: "People", value: String(memberCount) },
    ...(openBills > 0 ? [{ label: "Open for claiming", value: String(openBills) }] : []),
  ];
}

export function addedToGroupText(props: AddedToGroupEmailProps): string {
  return [`${props.adderName} added you to ${props.groupName}.`, intro, `Open the group: ${props.groupUrl}`].join("\n\n");
}

export default function AddedToGroupEmail(props: AddedToGroupEmailProps) {
  const { adderName, groupName, people, groupUrl, chrome } = props;
  return (
    <EmailShell
      preview={`${adderName} added you to ${groupName} on Bruno.`}
      chrome={chrome}
      reason={`${adderName} added you to this group on Bruno.`}
    >
      {people.length > 0 && (
        <>
          <AvatarStack people={people} />
          <Gap size={20} />
        </>
      )}
      <Title>
        {adderName} added you to {groupName}
      </Title>
      <Gap size={12} />
      <Lead>{intro}</Lead>
      <Gap size={28} />
      <Card>
        <Rows rows={details(props)} />
      </Card>
      <Gap size={28} />
      <CtaButton href={groupUrl}>Open the group</CtaButton>
    </EmailShell>
  );
}

AddedToGroupEmail.PreviewProps = {
  adderName: "Sam",
  groupName: "Lisbon trip",
  people: [
    { initials: "SO", tint: "pink" },
    { initials: "PR", tint: "cyan" },
    { initials: "AN", tint: "orange" },
  ],
  memberCount: 4,
  openBills: 1,
  groupUrl: "http://localhost:3000/groups/preview",
  chrome: previewChromeRequired,
} satisfies AddedToGroupEmailProps;
