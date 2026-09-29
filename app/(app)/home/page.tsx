import type { Metadata } from "next";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getHomeSummary } from "@/lib/home/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { HOME_PREVIEWS, homeCopy, type HomePreview } from "./_data";
import { homeSummary } from "./_lib/summary";
import { HomeEmpty, HomeSkeleton } from "./_components/home-states";
import { HomeHeadline } from "./_components/home-headline";
import { NextUpCard } from "./_components/next-up-card";
import { OpenBillsSection } from "./_components/open-bills-section";
import { PeopleSection } from "./_components/people-section";

export const metadata: Metadata = { title: homeCopy.metaTitle };

function previewFrom(value: string | undefined): HomePreview | null {
  if (process.env.NODE_ENV === "production" || value === undefined) return null;
  return (HOME_PREVIEWS as readonly string[]).includes(value) ? (value as HomePreview) : null;
}

export default async function HomePage({ searchParams }: PageProps<"/home">) {
  const { person } = await requireAppContext(routes.app);
  const preview = previewFrom(firstParam((await searchParams).preview));
  const firstName = firstNameOf(person.displayName);
  const data = await getHomeSummary(person.id);
  const summary = homeSummary(data);
  const empty = preview === "empty" || (preview === null && !data.hasAnyBills && data.people.length === 0);
  const now = new Date();

  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      <HomeHeadline
        firstName={firstName}
        headline={empty ? homeCopy.headline.empty : summary.headline}
        summary={preview === null && !empty ? summary : undefined}
      />
      {preview === "loading" && <HomeSkeleton />}
      {empty && <HomeEmpty />}
      {preview === null && !empty && (
        <div className="grid gap-8">
          {data.nextUp && <NextUpCard nextUp={data.nextUp} now={now} />}
          {data.people.length > 0 && <PeopleSection people={data.people} meta={summary.peopleMeta} />}
          {data.openBills.length > 0 && <OpenBillsSection bills={data.openBills} now={now} />}
        </div>
      )}
    </div>
  );
}
