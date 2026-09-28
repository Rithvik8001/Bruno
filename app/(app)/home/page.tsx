import type { Metadata } from "next";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { firstNameOf } from "@/lib/people/defaults";
import { HOME_PREVIEWS, homeCopy, mockBills, mockNextUp, mockPeople, type HomePreview } from "./_data";
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
  const summary = homeSummary(mockPeople);
  const nextUpPerson = mockPeople.find((p) => p.id === mockNextUp.personId);

  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      <HomeHeadline
        firstName={firstName}
        headline={preview === "empty" ? homeCopy.headline.empty : summary.headline}
        summary={preview === null ? summary : undefined}
      />
      {preview === "loading" && <HomeSkeleton />}
      {preview === "empty" && <HomeEmpty />}
      {preview === null && (
        <div className="grid gap-8">
          {nextUpPerson && <NextUpCard person={nextUpPerson} nextUp={mockNextUp} />}
          <PeopleSection people={mockPeople} meta={summary.peopleMeta} />
          <OpenBillsSection bills={mockBills} />
        </div>
      )}
    </div>
  );
}
