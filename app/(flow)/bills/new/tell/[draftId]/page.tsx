import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getBillComposer, type BillComposer } from "@/lib/groups/queries";
import { pendingGuestId, type PendingGuest } from "@/lib/members/pending";
import { defaultPersonTint } from "@/lib/people/defaults";
import type { PersonView } from "@/lib/people/person";
import { getTellReview } from "@/lib/tell/queries";
import { ManualBillFlow } from "../../../_composer/components/manual-bill-flow";
import { todayIso } from "../../../_composer/lib/draft";
import { draftFromTell } from "../../../_composer/lib/tell";
import { tellCopy } from "../_data";

export const metadata: Metadata = { title: tellCopy.metaTitle };

function guestView(guest: PendingGuest): PersonView {
  return { id: pendingGuestId(guest.key), displayName: guest.name, tint: defaultPersonTint(guest.name), buddy: null, onboarded: false };
}

export default async function TellReviewPage({ params }: PageProps<"/bills/new/tell/[draftId]">) {
  const { draftId } = await params;
  const { person } = await requireAppContext(routes.tellReview(draftId));
  const review = await getTellReview(draftId, person.id);
  if (!review) notFound();
  const group = await getBillComposer(review.groupId, person.id);
  if (!group) notFound();
  const today = todayIso();
  const told = draftFromTell(
    review.result,
    review.answers,
    group.members.map((m) => m.id),
    person.id,
    today,
  );
  const composer: BillComposer = { ...group, members: [...group.members, ...told.guests.map(guestView)] };

  return (
    <ManualBillFlow
      composer={composer}
      you={person.id}
      mode={{ kind: "tell", draftId: review.draftId, said: review.text, guests: told.guests }}
      initialDraft={told.draft}
      initialStep={told.step}
    />
  );
}
