import "server-only";
import AddedToGroupEmail, { addedToGroupSubject, addedToGroupText } from "@/emails/added-to-group";
import WelcomeEmail, { welcomeSubject, welcomeText } from "@/emails/welcome";
import { routes } from "@/lib/auth/rules";
import { db } from "@/lib/db";
import { firstNameOf } from "@/lib/people/defaults";
import { appUrl } from "@/lib/site";
import { deliver } from "../deliver";
import { emailPerson } from "../format";
import { emailRecipient } from "../recipients";

const AVATAR_STACK_MAX = 4;

export async function notifyAddedToGroup(groupId: string, personId: string, actorId: string): Promise<void> {
  const [group, recipient] = await Promise.all([
    db.group.findFirst({
      where: { id: groupId, deletedAt: null },
      select: {
        name: true,
        members: {
          where: { leftAt: null },
          orderBy: { joinedAt: "asc" },
          select: { person: { select: { id: true, displayName: true, tint: true } } },
        },
        _count: { select: { bills: { where: { status: "CLAIMING", deletedAt: null } } } },
      },
    }),
    emailRecipient(personId, null),
  ]);
  if (!group || !recipient) return;
  const actor = group.members.find((member) => member.person.id === actorId)?.person;
  if (!actor) return;
  const others = group.members.filter((member) => member.person.id !== actorId && member.person.id !== personId);
  const props = {
    adderName: firstNameOf(actor.displayName),
    groupName: group.name,
    people: [actor, ...others.map((member) => member.person)].slice(0, AVATAR_STACK_MAX).map(emailPerson),
    memberCount: group.members.length,
    openBills: group._count.bills,
    groupUrl: appUrl(routes.group(groupId)),
  };
  await deliver({
    kind: "addedToGroup",
    recipient,
    dedupeKey: `added/${groupId}/${personId}/${new Date().toISOString().slice(0, 10)}`,
    build: (chrome) => ({
      subject: addedToGroupSubject(props),
      react: AddedToGroupEmail({ ...props, chrome }),
      text: addedToGroupText({ ...props, chrome }),
    }),
  });
}

export async function notifyWelcome(personId: string): Promise<void> {
  const recipient = await emailRecipient(personId, null);
  if (!recipient) return;
  const props = { name: firstNameOf(recipient.displayName), scanUrl: appUrl(routes.newBill) };
  await deliver({
    kind: "welcome",
    recipient,
    dedupeKey: `welcome/${personId}`,
    build: (chrome) => ({
      subject: welcomeSubject(props.name),
      react: WelcomeEmail({ ...props, chrome }),
      text: welcomeText({ ...props, chrome }),
    }),
  });
}
