import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TimeZoneCookie } from "@/components/patterns/time-zone-cookie";
import { getAskStart } from "@/lib/ask/queries";
import { firstParam } from "@/lib/auth/redirect";
import { askParams, routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { cookieTimeZone } from "@/lib/time-zone";
import { AskScreen } from "./_components/ask-screen";
import { askCopy } from "./_data";

export const metadata: Metadata = { title: askCopy.metaTitle };

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const query = await searchParams;
  const requested = firstParam(query[askParams.group]) ?? null;
  const listen = firstParam(query[askParams.listen]) === "1";
  const { person } = await requireAppContext(routes.askAbout(requested));
  const timeZone = await cookieTimeZone();
  const start = await getAskStart(person.id, requested, timeZone ?? "UTC");
  if (!start) redirect(requested ? routes.ask : routes.app);
  if (!start.configured) redirect(requested ? routes.group(requested) : routes.app);

  return (
    <>
      <TimeZoneCookie serverTimeZone={timeZone} />
      <AskScreen start={start} you={{ id: person.id, displayName: person.displayName }} autoListen={listen} />
    </>
  );
}
