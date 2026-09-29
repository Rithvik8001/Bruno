import type { GuestClaimView } from "@/lib/members/queries";
import { firstNameOf } from "@/lib/people/defaults";
import { claimCopy } from "../_data";
import { ClaimHero } from "./claim-hero";

export function OfferHeader({ view }: { view: GuestClaimView }) {
  const guest = firstNameOf(view.guest.displayName);
  const by = view.addedBy ? firstNameOf(view.addedBy) : null;
  return (
    <div className="grid justify-items-center gap-4 text-center">
      <ClaimHero group={view.group} person={view.guest} />
      <div className="grid gap-2">
        <span className="text-small font-medium text-text-2">{by ? claimCopy.savedSpot(by) : claimCopy.savedSpotAnon}</span>
        <h1 className="m-0 text-heading text-balance">{claimCopy.title(guest, view.group.name)}</h1>
        {by && <p className="m-0 text-text-2 text-pretty">{claimCopy.body(by, guest)}</p>}
      </div>
    </div>
  );
}
