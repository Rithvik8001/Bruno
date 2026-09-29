"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import type { CurrencyCode } from "@/lib/currency";
import type { GroupRole } from "@/lib/domain/permissions";
import type { Cents } from "@/lib/money";
import { firstNameOf } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { groupDetailCopy } from "../_data";
import { AddPeopleSheet } from "./add-people/add-people-sheet";
import { CopyLinkButton } from "./copy-link-button";
import { GuestSheet, type GuestTarget } from "./guest-sheet";
import { MemberSheet, type MemberSheetTarget } from "./member-sheet";

export interface MemberRow {
  readonly person: PersonView;
  readonly role: GroupRole;
  readonly joined: string;
  readonly isYou: boolean;
  readonly guest: boolean;
  readonly addedBy: PersonView | null;
  readonly net: Cents;
}

export interface MembersSectionProps {
  groupId: string;
  groupName: string;
  currency: CurrencyCode;
  you: string;
  members: readonly MemberRow[];
  canManage: boolean;
  inviteUrl: string;
  inviteLabel: string;
}

function addedByLabel(row: MemberRow, you: string): string | null {
  const copy = groupDetailCopy.members;
  if (!row.addedBy) return null;
  return row.addedBy.id === you ? copy.addedByYou : copy.addedBy(firstNameOf(row.addedBy.displayName));
}

export function MembersSection({ groupId, groupName, currency, you, members, canManage, inviteUrl, inviteLabel }: MembersSectionProps) {
  const [target, setTarget] = useState<MemberSheetTarget | null>(null);
  const [guest, setGuest] = useState<GuestTarget | null>(null);
  const [adding, setAdding] = useState(false);
  const copy = groupDetailCopy.members;

  const caption = (row: MemberRow) => {
    const added = addedByLabel(row, you);
    if (row.guest) return [copy.guest, added].filter(Boolean).join(" · ");
    return [row.role === "ADMIN" ? copy.admin : copy.member, added ?? copy.joined(row.joined)].join(" · ");
  };

  const open = (row: MemberRow) => {
    if (row.guest) {
      setGuest({
        person: row.person,
        addedBy: addedByLabel(row, you) ?? copy.guest,
        net: row.net,
        canRemove: canManage || row.addedBy?.id === you,
      });
      return;
    }
    setTarget({ personId: row.person.id, name: row.person.displayName, role: row.role, isYou: row.isYou });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2.5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Button size="lg" onClick={() => setAdding(true)} className="gap-1.5 pr-4.5 pl-3.5">
          <Icon name="plus" size={18} strokeWidth={2.2} />
          {copy.add}
        </Button>
        <div className="flex min-w-0 items-center gap-3 rounded-tile bg-surface py-1.5 pr-1.5 pl-4">
          <span className="min-w-0 flex-1 truncate text-small text-text-2">{inviteLabel}</span>
          <CopyLinkButton url={inviteUrl} label={groupDetailCopy.copyLink} variant="floating" />
        </div>
      </div>
      <Stagger as="ul" className="m-0 grid list-none p-0 [&>li+li]:border-t [&>li+li]:border-line">
        {members.map((row) => {
          const { person, isYou } = row;
          const hasOptions = row.guest || isYou || canManage;
          return (
            <StaggerItem as="li" key={person.id} className="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
              <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
              <span className="grid min-w-0">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <span className="truncate">
                    {person.displayName} {isYou && <span className="text-text-2">{copy.you}</span>}
                  </span>
                  {row.guest && (
                    <Chip tint="neutral" size="sm" className="shrink-0">
                      {copy.guest}
                    </Chip>
                  )}
                </span>
                <span className="truncate text-small text-text-2">{caption(row)}</span>
              </span>
              {hasOptions ? (
                <IconButton
                  icon="more"
                  label={row.guest ? copy.manage(firstNameOf(person.displayName)) : copy.more(person.displayName)}
                  className="size-9 rounded-sm"
                  onClick={() => open(row)}
                />
              ) : (
                <span />
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
      <p className="m-0 text-footnote text-muted">{copy.note}</p>
      <MemberSheet groupId={groupId} target={target} canManage={canManage} onClose={() => setTarget(null)} />
      <GuestSheet groupId={groupId} groupName={groupName} currency={currency} target={guest} onClose={() => setGuest(null)} />
      <AddPeopleSheet
        groupId={groupId}
        groupName={groupName}
        inviteUrl={inviteUrl}
        inviteLabel={inviteLabel}
        open={adding}
        onOpenChange={setAdding}
      />
    </div>
  );
}
