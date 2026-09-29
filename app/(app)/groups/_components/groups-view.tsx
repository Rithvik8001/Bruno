"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { Rise } from "@/components/motion/rise";
import { Button } from "@/components/ui/button";
import { MomentTile } from "@/components/ui/icon-3d";
import { groupsCopy } from "../_data";
import { NewGroupSheet } from "./new-group-sheet";

export interface GroupsViewProps {
  hasGroups: boolean;
  children: ReactNode;
}

export function GroupsView({ hasGroups, children }: GroupsViewProps) {
  const [open, setOpen] = useState(false);
  const copy = groupsCopy;

  return (
    <div className="grid gap-6 px-5 pt-7 pb-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="m-0 text-heading">{copy.title}</h1>
        <Button variant="secondary" className="gap-1.5 pr-3.5 pl-2.5 text-small font-semibold" onClick={() => setOpen(true)}>
          <Icon name="plus" size={18} strokeWidth={2} />
          {copy.newGroup}
        </Button>
      </div>
      {hasGroups ? (
        children
      ) : (
        <Rise className="grid min-h-80 place-items-center rounded-card bg-surface px-6 py-8 text-center">
          <div className="grid max-w-[30ch] justify-items-center gap-4">
            <MomentTile icon="people" tint="indigo" size="lg" />
            <div className="grid gap-1.5">
              <span className="text-lead font-semibold">{copy.empty.title}</span>
              <span className="text-small text-text-2">{copy.empty.body}</span>
            </div>
            <Button className="h-11 text-small" onClick={() => setOpen(true)}>
              {copy.empty.cta}
            </Button>
          </div>
        </Rise>
      )}
      <NewGroupSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}
