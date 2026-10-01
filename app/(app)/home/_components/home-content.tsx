import { askCopy } from "@/app/(flow)/ask/_data";
import { AskBar } from "@/components/patterns/ask-bar";
import { getAskBar } from "@/lib/ask/queries";
import { routes } from "@/lib/auth/rules";
import type { PersonId } from "@/lib/domain/ids";
import { firstNameOf } from "@/lib/people/defaults";
import { getHomeSummary } from "@/lib/home/queries";
import { cookieTimeZone } from "@/lib/time-zone";
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
  const [data, ask] = await Promise.all([getHomeSummary(personId), cookieTimeZone().then((timeZone) => getAskBar(personId, timeZone ?? "UTC"))]);
  const summary = homeSummary(data);
  const nothingOpen =
    data.nextUp === null &&
    data.people.length === 0 &&
    data.openBills.length === 0;
  const empty = forceEmpty || nothingOpen;
  const now = new Date();
  const topPerson = data.people[0]?.person;
  const askExample = topPerson ? askCopy.bar.exampleWith(firstNameOf(topPerson.displayName)) : askCopy.bar.example;

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
        {ask.configured && (
          <AskBar
            className="-mt-3"
            href={routes.ask}
            micHref={routes.askAbout(null, true)}
            title={askCopy.bar.title}
            example={askExample}
            micLabel={askCopy.bar.mic}
            locked={
              ask.quota.left > 0
                ? null
                : { title: askCopy.bar.resting, body: askCopy.bar.used(ask.quota.limit) }
            }
          />
        )}
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
