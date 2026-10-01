"use client";

import { useState } from "react";
import { exportCopy } from "@/app/(app)/_components/export/_data";
import { ExportSheet } from "@/app/(app)/_components/export/export-sheet";
import { Menu, type MenuItem } from "@/components/ui/menu";
import type { ExportGroup } from "@/lib/export/rules";
import { groupDetailCopy } from "../_data";
import { GroupSettings, type GroupSettingsValues } from "./group-settings";

type Panel = "export" | "settings" | null;

export interface GroupMoreProps {
  groupId: string;
  exportGroups: readonly ExportGroup[];
  today: string;
  settings: GroupSettingsValues | null;
  className?: string;
}

export function GroupMore({ groupId, exportGroups, today, settings, className }: GroupMoreProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const copy = groupDetailCopy.more;
  const close = (open: boolean) => {
    if (!open) setPanel(null);
  };

  const items: MenuItem[] = [
    { id: "export", icon: "download", label: exportCopy.menu.label, caption: exportCopy.menu.caption, onSelect: () => setPanel("export") },
    ...(settings
      ? [{ id: "settings", icon: "settings", label: copy.settings, caption: copy.settingsCaption, onSelect: () => setPanel("settings") } as const]
      : []),
  ];

  return (
    <>
      <Menu label={copy.label} items={items} className={className} />
      <ExportSheet open={panel === "export"} onOpenChange={close} groups={exportGroups} today={today} group={groupId} />
      {settings && <GroupSettings {...settings} open={panel === "settings"} onOpenChange={close} />}
    </>
  );
}
