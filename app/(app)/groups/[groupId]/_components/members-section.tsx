"use client";

import { useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import type { GroupRole } from "@/lib/domain/permissions";
import type { PersonView } from "@/lib/people/person";
import { groupDetailCopy } from "../_data";
import { CopyLinkButton } from "./copy-link-button";
import { MemberSheet, type MemberSheetTarget } from "./member-sheet";

export interface MemberRow {
  readonly person: PersonView;
  readonly role: GroupRole;
  readonly joined: string;
  readonly isYou: boolean;
}

export interface MembersSectionProps {
  groupId: string;
  members: readonly MemberRow[];
  canManage: boolean;
  inviteUrl: string;
  inviteLabel: string;
}

export function MembersSection({ groupId, members, canManage, inviteUrl, inviteLabel }: MembersSectionProps) {
  const [target, setTarget] = useState<MemberSheetTarget | null>(null);
  const copy = groupDetailCopy.members;

  return (
    <div className="grid gap-4">
      <Stagger as="ul" className="m-0 grid list-none p-0 [&>li+li]:border-t [&>li+li]:border-line">
        {members.map(({ person, role, joined, isYou }) => {
          const hasOptions = isYou || canManage;
          return (
            <StaggerItem as="li" key={person.id} className="grid min-h-16 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5">
              <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="xl" />
              <span className="grid min-w-0">
                <span className="truncate font-medium">
                  {person.displayName} {isYou && <span className="text-text-2">{copy.you}</span>}
                </span>
                <span className="truncate text-small text-text-2">
                  {role === "ADMIN" ? copy.admin : copy.member} · {copy.joined(joined)}
                </span>
              </span>
              {hasOptions ? (
                <IconButton
                  icon="more"
                  label={copy.more(person.displayName)}
                  className="size-9 rounded-sm"
                  onClick={() => setTarget({ personId: person.id, name: person.displayName, role, isYou })}
                />
              ) : (
                <span />
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
      <div className="flex items-center gap-3 rounded-tile bg-surface py-1.5 pr-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate text-small text-text-2">{inviteLabel}</span>
        <CopyLinkButton url={inviteUrl} label={groupDetailCopy.copyLink} variant="floating" />
      </div>
      <p className="m-0 text-footnote text-muted">{copy.note}</p>
      <MemberSheet groupId={groupId} target={target} canManage={canManage} onClose={() => setTarget(null)} />
    </div>
  );
}
