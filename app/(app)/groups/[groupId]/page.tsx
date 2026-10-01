import type { Metadata } from "next";
import { cents } from "@/lib/money";
import { notFound } from "next/navigation";
import { askCopy } from "@/app/(flow)/ask/_data";
import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { AskBar } from "@/components/patterns/ask-bar";
import { backClassName } from "@/components/patterns/back-link-styles";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAskBar } from "@/lib/ask/queries";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { canManageGroup } from "@/lib/domain/permissions";
import { appUrl, displayUrl } from "@/lib/site";
import { getGroupForMember } from "@/lib/groups/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { cookieTimeZone } from "@/lib/time-zone";
import { cn } from "@/lib/utils/cn";
import { GROUP_TABS, groupDetailCopy, type GroupTab } from "./_data";
import { CopyLinkButton } from "@/components/patterns/copy-link-button";
import { GroupSettings } from "./_components/group-settings";
import { GroupTabs } from "./_components/group-tabs";
import { HeaderArt } from "./_components/header-art";
import { MembersSection } from "./_components/members-section";
import { SummaryTiles } from "./_components/summary-tiles";
import { TabEmpty } from "./_components/tab-empty";
import { BalancesSection } from "./_components/balances-section";
import { BillsSection } from "./_components/bills-section";

export const metadata: Metadata = { title: groupDetailCopy.metaTitle };

const joinedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function tabFrom(value: string | undefined): GroupTab {
  return (GROUP_TABS as readonly string[]).includes(value ?? "") ? (value as GroupTab) : "bills";
}

export default async function GroupPage({ params, searchParams }: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  const { person } = await requireAppContext(routes.group(groupId));
  const [group, ask] = await Promise.all([
    getGroupForMember(groupId, person.id),
    cookieTimeZone().then((timeZone) => getAskBar(person.id, timeZone ?? "UTC")),
  ]);
  if (!group) notFound();

  const tab = tabFrom(firstParam((await searchParams).tab));
  const canManage = canManageGroup(group.you);
  const invitePath = routes.invite(group.slug);
  const inviteUrl = appUrl(invitePath);
  const copy = groupDetailCopy;
  const now = new Date();
  const names = group.roster.map((m) => (m.person.id === person.id ? copy.youName : firstNameOf(m.person.displayName)));

  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      <PressLink href={routes.groups} className={backClassName}>
        <Icon name="chevron-left" size={18} />
        {copy.back}
      </PressLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <HeaderArt name={group.name} art={group.art} tint={group.tint} size="lg" />
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <CopyLinkButton url={inviteUrl} label={copy.inviteLink} copiedLabel={copy.copied} />
          <PressLink href={routes.newBillFor(group.id)} className={cn(buttonVariants({ size: "md" }), "order-first w-full gap-1.5 pr-3.5 pl-2.5 text-small sm:order-none sm:w-auto")}>
            <Icon name="plus" size={18} strokeWidth={2} />
            {copy.addBill}
          </PressLink>
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
      {ask.configured && group.billCount > 0 && (
        <AskBar
          href={routes.askAbout(group.id)}
          micHref={routes.askAbout(group.id, true)}
          title={askCopy.bar.titleGroup(group.name)}
          example={askCopy.bar.exampleGroup}
          micLabel={askCopy.bar.mic}
          locked={
            ask.quota.left > 0
              ? null
              : { title: askCopy.bar.resting, body: askCopy.bar.used(ask.quota.limit), action: askCopy.bar.goPro, href: routes.settings }
          }
        />
      )}
      <GroupTabs value={tab} />

      {tab === "bills" && group.bills.length > 0 && <BillsSection bills={group.bills} you={person.id} now={now} />}
      {tab === "bills" && group.bills.length === 0 && (
        <TabEmpty
          moment="receipt"
          tint="violet"
          title={copy.bills.title}
          body={copy.bills.body}
          action={
            <PressLink href={routes.newBillFor(group.id)} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "text-small")}>
              {copy.addBill}
            </PressLink>
          }
        />
      )}
      {tab === "balances" &&
        (group.everyoneSquare && group.payments.length === 0 && group.settlements.length === 0 ? (
          <TabEmpty moment="moneywings" tint="green" title={copy.balances.title} body={copy.balances.body} />
        ) : (
          <BalancesSection
            groupId={group.id}
            balances={group.balances}
            payments={group.payments}
            settlements={group.settlements}
            currency={group.currency}
            you={person.id}
          />
        ))}
      {tab === "members" && (
        <MembersSection
          groupId={group.id}
          groupName={group.name}
          currency={group.currency}
          you={person.id}
          canManage={canManage}
          inviteUrl={inviteUrl}
          inviteLabel={displayUrl(inviteUrl)}
          members={group.roster.map((m) => ({
            person: m.person,
            role: m.role,
            joined: joinedFormat.format(m.joinedAt),
            isYou: m.person.id === person.id,
            guest: m.guest,
            addedBy: m.addedBy,
            net: group.balances.find((b) => b.person.id === m.person.id)?.net ?? cents(0),
          }))}
        />
      )}
    </div>
  );
}
