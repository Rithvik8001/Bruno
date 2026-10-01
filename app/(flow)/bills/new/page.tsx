import type { Metadata } from "next";
import { PressLink } from "@/components/motion/motion-link";
import { BackLink } from "@/components/patterns/back-link";
import { TimeZoneCookie } from "@/components/patterns/time-zone-cookie";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { firstParam } from "@/lib/auth/redirect";
import { billParams, routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { listGroupsFor } from "@/lib/groups/queries";
import { getScanAvailability } from "@/lib/scans/queries";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "./_data";
import { NewBillEntry } from "./_components/new-bill-entry";
import { cookieTimeZone } from "@/lib/time-zone";

export const metadata: Metadata = { title: newBillCopy.metaTitle };
export const maxDuration = 60;

export default async function NewBillPage({ searchParams }: PageProps<"/bills/new">) {
  const requested = firstParam((await searchParams)[billParams.group]);
  const { person } = await requireAppContext(requested ? routes.newBillFor(requested) : routes.newBill);
  const [groups, timeZone] = await Promise.all([listGroupsFor(person.id), cookieTimeZone()]);
  const selected = groups.find((g) => g.id === requested) ?? groups[0] ?? null;
  const copy = newBillCopy.entry;

  if (!selected) {
    return (
      <div className="grid gap-6 px-5 pt-5 pb-10">
        <BackLink href={routes.app} label={copy.back} />
        <div className="grid gap-1.5">
          <h1 className="m-0 text-heading">{copy.title}</h1>
          <p className="m-0 text-text-2">{copy.body}</p>
        </div>
        <EmptyState
          icon={{ moment: "people" }}
          tint="violet"
          message={copy.empty.message}
          className="min-h-80"
          action={
            <PressLink href={routes.groups} className={cn(buttonVariants({ size: "md" }), "text-small")}>
              {copy.empty.cta}
            </PressLink>
          }
        />
      </div>
    );
  }

  const availability = await getScanAvailability(person.id, timeZone ?? "UTC");

  return (
    <>
      <TimeZoneCookie serverTimeZone={timeZone} />
      <NewBillEntry
        groups={groups}
        selectedId={selected.id}
        currency={selected.currency}
        configured={availability.configured}
        tellConfigured={availability.tellConfigured}
        quota={availability.quota}
      />
    </>
  );
}
