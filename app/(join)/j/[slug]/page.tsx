import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { MomentTile } from "@/components/ui/icon-3d";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { getGroupInvite, isActiveMemberOf } from "@/lib/groups/queries";
import { cn } from "@/lib/utils/cn";
import { joinCopy } from "./_data";
import { JoinButton } from "./_components/join-button";
import { JoinCard } from "./_components/join-card";

export const metadata: Metadata = { title: joinCopy.metaTitle };

export default async function JoinPage({ params }: PageProps<"/j/[slug]">) {
  const { slug } = await params;
  const { person } = await requireAppContext(routes.invite(slug));
  const invite = await getGroupInvite(slug);

  if (!invite) {
    return (
      <div className="grid justify-items-center gap-4 rounded-card bg-surface px-6 py-10 text-center">
        <MomentTile icon="link" tint="cyan" size="lg" />
        <div className="grid gap-1.5">
          <span className="text-lead font-semibold">{joinCopy.dead.title}</span>
          <span className="text-small text-text-2">{joinCopy.dead.body}</span>
        </div>
        <Link href={routes.app} className={cn(buttonVariants({ size: "md" }), "text-small")}>
          {joinCopy.dead.home}
        </Link>
      </div>
    );
  }

  if (await isActiveMemberOf(invite.id, person.id)) redirect(routes.group(invite.id));

  return (
    <>
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading text-balance">{joinCopy.title(invite.name)}</h1>
        <p className="m-0 text-text-2 text-pretty">{joinCopy.subtitle}</p>
      </div>
      <JoinCard invite={invite} />
      <div className="grid gap-1">
        <JoinButton slug={invite.slug} label={joinCopy.join(invite.name)} />
        <Link href={routes.app} className={cn(buttonVariants({ variant: "tertiary", fullWidth: true }), "h-11")}>
          {joinCopy.notNow}
        </Link>
      </div>
    </>
  );
}
