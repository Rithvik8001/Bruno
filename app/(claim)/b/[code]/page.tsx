import type { Metadata } from "next";
import { routes } from "@/lib/auth/rules";
import { getAppContext } from "@/lib/auth/session";
import { getLiveBill } from "@/lib/claiming/queries";
import { CLAIM_CODE_PATTERN } from "@/lib/claiming/schema";
import { shortDay } from "@/lib/dates";
import { liveClaimCopy } from "./_data";
import { ClaimLinkState, StateButton } from "./_components/claim-link-state";
import { FinishedCard } from "./_components/finished-card";
import { LiveClaimScreen } from "./_components/live-claim-screen";
import { PublicHeader } from "./_components/public-header";

export const metadata: Metadata = { title: liveClaimCopy.metaTitle };

function DeadLink({ signedIn }: { signedIn: boolean }) {
  const copy = liveClaimCopy.dead;
  return (
    <>
      <PublicHeader signedIn={signedIn} />
      <ClaimLinkState icon="link" tint="neutral" title={copy.title} body={copy.body}>
        <StateButton href={signedIn ? routes.app : routes.home}>{copy.home}</StateButton>
      </ClaimLinkState>
    </>
  );
}

export default async function LiveClaimPage({ params }: PageProps<"/b/[code]">) {
  const { code } = await params;
  const viewer = await getAppContext();
  const signedIn = viewer !== null;
  if (!CLAIM_CODE_PATTERN.test(code)) return <DeadLink signedIn={signedIn} />;
  const bill = await getLiveBill(code, viewer);
  if (!bill) return <DeadLink signedIn={signedIn} />;

  if (bill.status === "finished") {
    return (
      <>
        <PublicHeader signedIn={signedIn} />
        <FinishedCard bill={bill} />
      </>
    );
  }

  return (
    <>
      {!bill.canManage && <PublicHeader signedIn={signedIn} />}
      <LiveClaimScreen bill={bill} dayLabel={shortDay(bill.occurredAt, new Date())} />
    </>
  );
}
