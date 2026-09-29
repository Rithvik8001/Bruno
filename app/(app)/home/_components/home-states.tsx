import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import { ListRowSkeleton, Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { homeCopy } from "../_data";
import { Greeting } from "./greeting";

export function HomeEmpty() {
  const copy = homeCopy.empty;
  return (
    <Rise className="grid min-h-90 place-items-center rounded-card bg-surface px-6 py-8 text-center">
      <div className="grid max-w-[32ch] justify-items-center gap-4">
        <MomentTile icon="receipt" tint="violet" size="lg" />
        <div className="grid gap-1.5">
          <span className="text-lead font-semibold">{copy.title}</span>
          <span className="text-small text-text-2">{copy.body}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <PressLink href={routes.newBill} className={cn(buttonVariants({ size: "md" }), "h-11 text-small")}>
            {copy.add}
          </PressLink>
          <PressLink href={routes.groups} className={cn(buttonVariants({ variant: "elevated", size: "md" }), "h-11 text-small")}>
            {copy.group}
          </PressLink>
        </div>
      </div>
    </Rise>
  );
}

export function HomeSkeleton({ firstName }: { firstName?: string }) {
  return (
    <>
      <div className="grid gap-0.5">
        {firstName ? <Greeting firstName={firstName} /> : <Skeleton className="my-1 h-3 w-28" />}
        <Skeleton className="my-1 h-6.5 w-44 rounded-sm" />
      </div>
      <div aria-busy className="grid gap-7">
        <Skeleton className="h-21 rounded-card bg-surface" />
        <div className="grid">
          <ListRowSkeleton titleWidth="45%" captionWidth="30%" />
          <ListRowSkeleton titleWidth="60%" captionWidth="25%" />
          <ListRowSkeleton titleWidth="40%" captionWidth="35%" />
        </div>
      </div>
    </>
  );
}
