"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Tabs } from "@/components/ui/segmented-control";
import { FEED_FILTERS, type FeedFilter } from "@/lib/feed/types";
import { activityCopy } from "../_data";

export function ActivityFilters({ value }: { value: FeedFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  return (
    <Tabs
      label={activityCopy.filtersLabel}
      value={value}
      options={FEED_FILTERS.map((filter) => ({ value: filter, label: activityCopy.filters[filter] }))}
      onValueChange={(filter) =>
        startTransition(() => router.replace(filter === "all" ? pathname : `${pathname}?filter=${filter}`, { scroll: false }))
      }
    />
  );
}
