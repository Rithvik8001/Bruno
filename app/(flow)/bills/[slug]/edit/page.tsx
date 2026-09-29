import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { firstParam } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getEditableBill } from "@/lib/bills/queries";
import type { SplitMethod } from "@/lib/bills/types";
import { ManualBillFlow } from "../../_composer/components/manual-bill-flow";
import { FLOW_STEPS, type FlowStep } from "../../_composer/lib/steps";
import { draftFromBill } from "../../_composer/lib/draft";
import { editBillCopy } from "./_data";

export const metadata: Metadata = { title: editBillCopy.metaTitle };

function stepFrom(value: string | undefined, method: SplitMethod): FlowStep {
  const step = (FLOW_STEPS as readonly string[]).includes(value ?? "") ? (value as FlowStep) : "items";
  if (step === "split" && method === "ITEMS") return "claim";
  if (step === "claim" && method !== "ITEMS") return "split";
  return step;
}

export default async function EditBillPage({ params, searchParams }: PageProps<"/bills/[slug]/edit">) {
  const { slug } = await params;
  const { person } = await requireAppContext(routes.editBill(slug));
  const bill = await getEditableBill(slug, person.id);
  if (!bill) notFound();
  if (!bill.canEdit) redirect(routes.bill(slug));

  return (
    <ManualBillFlow
      composer={bill.composer}
      you={person.id}
      mode={{ kind: "edit", billId: bill.billId, slug: bill.slug }}
      initialDraft={draftFromBill(bill.values, bill.composer.members.map((m) => m.id))}
      initialStep={stepFrom(firstParam((await searchParams).step), bill.values.method)}
    />
  );
}
