"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/segmented-control";
import { GROUP_TABS, groupDetailCopy, type GroupTab } from "../_data";

export function GroupTabs({ value }: { value: GroupTab }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Tabs
      label={groupDetailCopy.tabsLabel}
      value={value}
      options={GROUP_TABS.map((tab) => ({ value: tab, label: groupDetailCopy.tabs[tab] }))}
      onValueChange={(tab) => router.replace(tab === "bills" ? pathname : `${pathname}?tab=${tab}`, { scroll: false })}
      className="justify-self-start"
    />
  );
}
