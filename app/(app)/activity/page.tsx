import type { Metadata } from "next";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getActivityFeed } from "@/lib/feed/queries";
import { feedFilterSchema } from "@/lib/feed/schema";
import type { FeedFilter } from "@/lib/feed/types";
import { activityCopy } from "./_data";
import { ActivityEmpty } from "./_components/activity-empty";
import { ActivityFeed } from "./_components/activity-feed";
import { ActivityFilters } from "./_components/activity-filters";
import { SeenMarker } from "./_components/seen-marker";

export const metadata: Metadata = { title: activityCopy.metaTitle };

function filterFrom(value: string | undefined): FeedFilter {
  const parsed = feedFilterSchema.safeParse(value);
  return parsed.success ? parsed.data : "all";
}

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const filter = filterFrom(firstParam((await searchParams).filter));
  const { person } = await requireAppContext(filter === "all" ? routes.activity : `${routes.activity}?filter=${filter}`);
  const page = await getActivityFeed(person.id, { filter });
  const now = new Date();

  return (
    <div className="grid gap-6 px-5 pt-7 pb-10">
      <SeenMarker />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-heading">{activityCopy.title}</h1>
        <ActivityFilters value={filter} />
      </div>
      {page.items.length === 0 ? (
        <ActivityEmpty />
      ) : (
        <ActivityFeed key={filter} filter={filter} initial={page} you={person.id} now={now} />
      )}
    </div>
  );
}
