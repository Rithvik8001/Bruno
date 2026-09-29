import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { AvatarStack } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { GroupArtTile } from "@/components/ui/icon-3d";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { canManageGroup } from "@/lib/domain/permissions";
import { serverEnv } from "@/lib/env";
import { getGroupForMember } from "@/lib/groups/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { GROUP_TABS, groupDetailCopy, type GroupTab } from "./_data";
import { CopyLinkButton } from "./_components/copy-link-button";
import { GroupSettings } from "./_components/group-settings";
import { GroupTabs } from "./_components/group-tabs";
import { MembersSection } from "./_components/members-section";
import { SummaryTiles } from "./_components/summary-tiles";
import { TabEmpty } from "./_components/tab-empty";

export const metadata: Metadata = { title: groupDetailCopy.metaTitle };

const joinedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function tabFrom(value: string | undefined): GroupTab {
  return (GROUP_TABS as readonly string[]).includes(value ?? "") ? (value as GroupTab) : "bills";
}

export default async function GroupPage({ params, searchParams }: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  const { person } = await requireAppContext(routes.group(groupId));
  const group = await getGroupForMember(groupId, person.id);
  if (!group) notFound();

  const tab = tabFrom(firstParam((await searchParams).tab));
  const canManage = canManageGroup(group.you);
  const invitePath = routes.invite(group.slug);
  const inviteUrl = new URL(invitePath, serverEnv().BETTER_AUTH_URL).toString();
  const copy = groupDetailCopy;
  const names = group.roster.map((m) => (m.person.id === person.id ? copy.youName : firstNameOf(m.person.displayName)));

  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      <Link
        href={routes.groups}
        className="-ml-1.5 inline-flex h-9 items-center gap-1.5 justify-self-start rounded-sm pr-2.5 pl-1.5 text-small font-medium text-text-2 no-underline hover:bg-surface hover:text-text"
      >
        <Icon name="chevron-left" size={18} />
        {copy.back}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <GroupArtTile name={group.name} art={group.art} tint={group.tint} size="lg" />
          <div className="grid min-w-0 gap-1.5">
            <h1 className="m-0 truncate text-heading">{group.name}</h1>
            <div className="flex min-w-0 items-center gap-2.5">
              <AvatarStack
                people={group.roster.map((m) => ({ id: m.person.id, name: m.person.displayName, tint: m.person.tint, buddy: m.person.buddy }))}
                size="sm"
                max={4}
              />
              <span className="truncate text-footnote text-text-2">{copy.membersLine(names.slice(0, 3), group.currency)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={inviteUrl} />
          <Link href={routes.newBill} className={cn(buttonVariants({ size: "md" }), "gap-1.5 pr-3.5 pl-2.5 text-small")}>
            <Icon name="plus" size={18} strokeWidth={2} />
            {copy.addBill}
          </Link>
          {canManage && (
            <GroupSettings
              groupId={group.id}
              initial={{ name: group.name, tint: group.tint, art: group.art, currency: group.currency }}
              currencyLocked={group.billCount > 0}
              canDelete={group.everyoneSquare}
            />
          )}
        </div>
      </div>

      <SummaryTiles group={group} />
      <GroupTabs value={tab} />

      {tab === "bills" && (
        <TabEmpty
          moment="receipt"
          tint="violet"
          title={copy.bills.title}
          body={copy.bills.body}
          action={
            <Link href={routes.newBill} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "text-small")}>
              {copy.addBill}
            </Link>
          }
        />
      )}
      {tab === "balances" && <TabEmpty moment="moneywings" tint="green" title={copy.balances.title} body={copy.balances.body} />}
      {tab === "members" && (
        <MembersSection
          groupId={group.id}
          canManage={canManage}
          inviteUrl={inviteUrl}
          inviteLabel={inviteUrl.replace(/^https?:\/\//, "")}
          members={group.roster.map((m) => ({
            person: m.person,
            role: m.role,
            joined: joinedFormat.format(m.joinedAt),
            isYou: m.person.id === person.id,
          }))}
        />
      )}
    </div>
  );
}
