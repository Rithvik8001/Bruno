import type { Metadata } from "next";
import { Rise } from "@/components/motion/rise";
import { routes } from "@/lib/auth/rules";
import { getAppContext } from "@/lib/auth/session";
import { getGuestClaim } from "@/lib/members/queries";
import { claimSchema } from "@/lib/members/schema";
import { firstNameOf } from "@/lib/people/defaults";
import { claimCopy } from "./_data";
import { CarryList } from "./_components/carry-list";
import { ClaimScreen } from "./_components/claim-screen";
import { DeadState } from "./_components/dead-state";
import { OfferHeader } from "./_components/offer-header";
import { SignedOutActions } from "./_components/signed-out-actions";

export const metadata: Metadata = {
  title: claimCopy.metaTitle,
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

const addedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export default async function ClaimGuestPage({ params }: PageProps<"/j/claim/[token]">) {
  const { token } = await params;
  const context = await getAppContext();
  const valid = claimSchema.safeParse({ token });
  const view = valid.success ? await getGuestClaim(valid.data.token, context?.person.id ?? null) : null;

  if (!view) {
    const copy = claimCopy.invalid;
    return <DeadState icon="link" tint="neutral" title={copy.title} body={copy.body} howTitle={copy.howTitle} steps={copy.steps} cta={copy.cta} href={routes.app} />;
  }

  const guest = firstNameOf(view.guest.displayName);
  const by = view.addedBy ? firstNameOf(view.addedBy) : null;

  if (context && view.alreadyMember) {
    const copy = claimCopy.alreadyMember;
    return (
      <DeadState
        icon="people"
        tint="amber"
        title={copy.title(view.group.name)}
        body={copy.body}
        howTitle={copy.howTitle}
        steps={copy.steps(by, guest)}
        cta={copy.cta(view.group.name)}
        href={routes.group(view.group.id)}
      />
    );
  }

  const addedOn = claimCopy.addedOn(by, addedFormat.format(view.addedAt));

  if (!context) {
    return (
      <Rise className="grid gap-6">
        <OfferHeader view={view} />
        <CarryList view={view} addedOn={addedOn} />
        <SignedOutActions returnTo={routes.claimGuest(token)} />
      </Rise>
    );
  }

  return <ClaimScreen token={token} view={view} viewer={context.person} addedOn={addedOn} />;
}
