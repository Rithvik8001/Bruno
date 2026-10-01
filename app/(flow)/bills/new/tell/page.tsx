import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TimeZoneCookie } from "@/components/patterns/time-zone-cookie";
import { firstParam } from "@/lib/auth/redirect";
import { billParams, routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getBillComposer, listGroupsFor } from "@/lib/groups/queries";
import { getScanAvailability } from "@/lib/scans/queries";
import { getTellText } from "@/lib/tell/queries";
import { cookieTimeZone } from "../_lib/time-zone";
import { tellCopy } from "./_data";
import { TellScreen } from "./_components/tell-screen";

export const metadata: Metadata = { title: tellCopy.metaTitle };
export const maxDuration = 60;

export default async function TellBillPage({ searchParams }: PageProps<"/bills/new/tell">) {
  const query = await searchParams;
  const requested = firstParam(query[billParams.group]);
  const from = firstParam(query[billParams.from]);
  if (!requested) redirect(routes.newBill);
  const { person } = await requireAppContext(routes.tellBill(requested, from));
  const [composer, groups, timeZone] = await Promise.all([
    getBillComposer(requested, person.id),
    listGroupsFor(person.id),
    cookieTimeZone(),
  ]);
  if (!composer) notFound();
  const availability = await getScanAvailability(person.id, timeZone ?? "UTC");
  if (!availability.tellConfigured || availability.quota.left <= 0) redirect(routes.newBillFor(composer.id));
  const initialText = from ? ((await getTellText(from, person.id)) ?? "") : "";

  return (
    <>
      <TimeZoneCookie serverTimeZone={timeZone} />
      <TellScreen composer={composer} groups={groups} you={person.id} quota={availability.quota} initialText={initialText} />
    </>
  );
}
