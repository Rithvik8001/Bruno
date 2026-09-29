import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { firstParam } from "@/lib/auth/redirect";
import { billParams, routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getBillComposer } from "@/lib/groups/queries";
import { newBillCopy } from "../_data";
import { ManualBillFlow } from "../../_composer/components/manual-bill-flow";

export const metadata: Metadata = { title: newBillCopy.metaTitle };

export default async function ManualBillPage({ searchParams }: PageProps<"/bills/new/manual">) {
  const requested = firstParam((await searchParams)[billParams.group]);
  if (!requested) redirect(routes.newBill);
  const { person } = await requireAppContext(routes.manualBill(requested));
  const composer = await getBillComposer(requested, person.id);
  if (!composer) notFound();
  return <ManualBillFlow composer={composer} you={person.id} mode={{ kind: "create" }} />;
}
