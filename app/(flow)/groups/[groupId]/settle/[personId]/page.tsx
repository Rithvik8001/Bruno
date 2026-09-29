import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { firstParam, safeNextPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getSettleUp } from "@/lib/settlements/queries";
import { settleCopy } from "./_data";
import { backKindOf } from "./_lib/view";
import { SettleScreen } from "./_components/settle-screen";

export const metadata: Metadata = { title: settleCopy.metaTitle };

export default async function SettlePage({ params, searchParams }: PageProps<"/groups/[groupId]/settle/[personId]">) {
  const { groupId, personId } = await params;
  const back = firstParam((await searchParams).back);
  const { person } = await requireAppContext(routes.settle(groupId, personId, back));
  const view = await getSettleUp(groupId, personId, person.id);
  if (!view) notFound();
  const backHref = back ? safeNextPath(back) : routes.app;

  return <SettleScreen view={view} backHref={backHref} backKind={backKindOf(backHref)} />;
}
