import type { PersonId } from "@/lib/domain/ids";
import { getHomeSummary } from "@/lib/home/queries";
import { homeCopy } from "../_data";
import { homeSummary } from "../_lib/summary";
import { HomeEmpty } from "./home-states";
import { HomeHeadline } from "./home-headline";
import { NextUpCard } from "./next-up-card";
import { OpenBillsSection } from "./open-bills-section";
import { PeopleSection } from "./people-section";

export interface HomeContentProps {
  personId: PersonId;
  firstName: string;
  forceEmpty: boolean;
}

export async function HomeContent({
  personId,
  firstName,
  forceEmpty,
}: HomeContentProps) {
  const data = await getHomeSummary(personId);
  const summary = homeSummary(data);
  const nothingOpen =
    data.nextUp === null &&
    data.people.length === 0 &&
    data.openBills.length === 0;
  const empty = forceEmpty || nothingOpen;
  const now = new Date();

  if (empty) {
    return (
      <>
        <HomeHeadline
          firstName={firstName}
          headline={
            data.hasAnyBills && !forceEmpty
              ? homeCopy.headline.settled
              : homeCopy.headline.empty
          }
        />
        <HomeEmpty />
      </>
    );
  }

  return (
    <>
      <HomeHeadline
        firstName={firstName}
        headline={summary.headline}
        summary={summary}
      />
      <div className="grid gap-8">
        {data.nextUp && <NextUpCard nextUp={data.nextUp} now={now} />}
        {data.people.length > 0 && (
          <PeopleSection people={data.people} meta={summary.peopleMeta} />
        )}
        {data.openBills.length > 0 && (
          <OpenBillsSection bills={data.openBills} now={now} />
        )}
      </div>
    </>
  );
}
