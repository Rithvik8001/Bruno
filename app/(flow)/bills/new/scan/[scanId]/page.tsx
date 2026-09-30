import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getBillComposer } from "@/lib/groups/queries";
import { getScanReview } from "@/lib/scans/queries";
import { ManualBillFlow } from "../../../_composer/components/manual-bill-flow";
import { todayIso } from "../../../_composer/lib/draft";
import { draftFromScan } from "../../../_composer/lib/scan";
import { newBillCopy } from "../../_data";

export const metadata: Metadata = { title: newBillCopy.metaTitle };

export default async function ScanReviewPage({ params }: PageProps<"/bills/new/scan/[scanId]">) {
  const { scanId } = await params;
  const { person } = await requireAppContext(routes.scanReview(scanId));
  const today = todayIso();
  const review = await getScanReview(scanId, person.id, today);
  if (!review) notFound();
  const composer = await getBillComposer(review.groupId, person.id);
  if (!composer) notFound();
  const members = composer.members.map((m) => m.id);

  return (
    <ManualBillFlow
      composer={composer}
      you={person.id}
      mode={{
        kind: "scan",
        scanId: review.scanId,
        receipt: {
          merchant: review.result.merchant,
          printedTotal: review.result.printedTotal,
          currencyMismatch: review.result.currencyMismatch,
          duplicate: review.duplicate,
        },
      }}
      initialDraft={draftFromScan(review.result, members, person.id, today)}
    />
  );
}
