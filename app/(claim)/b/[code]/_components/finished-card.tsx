import { PressLink } from "@/components/motion/motion-link";
import { PushOptInCard } from "@/components/pwa/push-opt-in-card";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { GroupArtTile, MomentTile } from "@/components/ui/icon-3d";
import { Receipt } from "@/components/ui/receipt";
import { routes } from "@/lib/auth/rules";
import { claimedList } from "@/lib/bills/messages";
import type { FinishedBill } from "@/lib/claiming/queries";
import { formatMoney } from "@/lib/currency";
import { shortDay } from "@/lib/dates";
import { firstNameOf } from "@/lib/people/defaults";
import { optInCopy } from "@/lib/pwa/messages";
import { cn } from "@/lib/utils/cn";
import { liveClaimCopy } from "../_data";
import { ClaimLinkState, StateButton } from "./claim-link-state";
import { TakeoverActions } from "./takeover-actions";

export function FinishedCard({ bill }: { bill: FinishedBill }) {
  const copy = liveClaimCopy.finished;
  const viewer = bill.viewer;
  const paidByYou = viewer?.person.id === bill.payer.id;
  const payer = paidByYou ? liveClaimCopy.you : firstNameOf(bill.payer.displayName);
  const claimed = bill.yourShare !== null && viewer !== null;
  const member = viewer?.kind === "member";

  return (
    <ClaimLinkState icon="check" tint="green" title={copy.title(bill.title)} body={copy.body(payer)}>
      <Receipt bodyClassName="grid px-4 py-2">
        <div className="flex items-center gap-2.5 pt-1.5 pb-2.5">
          <GroupArtTile name={bill.group.name} tint={bill.group.tint} art={bill.group.art} size="xs" />
          <span className="grid min-w-0">
            <span className="truncate font-semibold">{bill.title}</span>
            <span className="truncate text-caption font-normal text-muted">
              {copy.meta(bill.group.name, paidByYou ? payer.toLowerCase() : payer, shortDay(bill.occurredAt, new Date()))}
            </span>
          </span>
        </div>
        {claimed && viewer && bill.yourShare !== null && (
          <div className="flex min-h-14 items-center gap-3 border-t border-line">
            <Avatar
              name={viewer.person.displayName}
              tint={viewer.person.tint}
              buddy={viewer.person.buddy}
              size="sm"
              className="size-7"
            />
            <span className="grid min-w-0 flex-1">
              <span className="font-medium">{copy.yourShare}</span>
              <span className="truncate text-footnote text-text-2">{claimedList(bill.yourItems)}</span>
            </span>
            <span className="text-lead font-semibold">{formatMoney(bill.yourShare, bill.currency)}</span>
          </div>
        )}
        <div className="flex min-h-12 items-center justify-between border-t border-line text-small text-text-2">
          <span>{copy.total}</span>
          <span className="font-medium text-text">{formatMoney(bill.total, bill.currency)}</span>
        </div>
        {!claimed && (
          <p className="m-0 border-t border-line pt-2.5 pb-2 text-footnote text-text-2">{copy.nothing}</p>
        )}
      </Receipt>

      {!bill.signedIn && (
        <div className="grid gap-3.5 rounded-card bg-brand-tint p-4.5">
          <div className="flex items-center gap-3.5">
            <MomentTile icon="sparkles" tint="violet" size="md" className="bg-bg" />
            <span className="grid min-w-0">
              <span className="text-body font-semibold">
                {claimed && viewer ? copy.spotTitle(firstNameOf(viewer.person.displayName)) : copy.nextTitle}
              </span>
              <span className="text-small text-text-2 text-pretty">{claimed ? copy.spotBody(payer) : copy.nextBody}</span>
            </span>
          </div>
          {claimed && viewer?.kind === "guest" ? (
            <TakeoverActions code={bill.code} />
          ) : (
            <div className="grid gap-1">
              <PressLink wide href={routes.signUp} className={cn(buttonVariants({ size: "lg", fullWidth: true }))}>
                {copy.getBruno}
              </PressLink>
              <PressLink
                wide
                href={routes.signIn}
                className={cn(buttonVariants({ variant: "tertiary", fullWidth: true }), "h-10 text-small")}
              >
                {copy.haveAccount}
              </PressLink>
            </div>
          )}
        </div>
      )}
      {member && <StateButton href={routes.group(bill.group.id)}>{copy.openGroup(bill.group.name)}</StateButton>}
      {member && paidByYou && bill.owers.length > 0 && (
        <PushOptInCard copy={optInCopy.split(bill.owers.map((p) => firstNameOf(p.displayName)))} snoozeKey="optIn:split" />
      )}
    </ClaimLinkState>
  );
}
