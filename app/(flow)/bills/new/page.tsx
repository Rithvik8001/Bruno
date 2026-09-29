import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { firstParam } from "@/lib/auth/redirect";
import { billParams, routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { listGroupsFor } from "@/lib/groups/queries";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "./_data";
import { BackLink } from "@/components/patterns/back-link";
import { GroupChips } from "./_components/group-chips";
import { TypeItInCard } from "./_components/type-it-in-card";

export const metadata: Metadata = { title: newBillCopy.metaTitle };

export default async function NewBillPage({ searchParams }: PageProps<"/bills/new">) {
  const requested = firstParam((await searchParams)[billParams.group]);
  const { person } = await requireAppContext(requested ? routes.newBillFor(requested) : routes.newBill);
  const groups = await listGroupsFor(person.id);
  const selected = groups.find((g) => g.id === requested) ?? groups[0] ?? null;
  const copy = newBillCopy.entry;

  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      <BackLink href={routes.app} label={copy.back} />
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{copy.title}</h1>
        <p className="m-0 text-text-2">{copy.body}</p>
      </div>
      {selected ? (
        <>
          <GroupChips groups={groups} selectedId={selected.id} />
          <TypeItInCard href={routes.manualBill(selected.id)} />
        </>
      ) : (
        <EmptyState
          icon={{ moment: "people" }}
          tint="violet"
          message={copy.empty.message}
          className="min-h-80"
          action={
            <Link href={routes.groups} className={cn(buttonVariants({ size: "md" }), "text-small")}>
              {copy.empty.cta}
            </Link>
          }
        />
      )}
    </div>
  );
}
