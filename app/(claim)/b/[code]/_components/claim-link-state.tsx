import type { ReactNode } from "react";
import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export interface ClaimLinkStateProps {
  icon: MomentIconId;
  tint: Tint;
  title: string;
  body: string;
  children?: ReactNode;
}

export function ClaimLinkState({ icon, tint, title, body, children }: ClaimLinkStateProps) {
  return (
    <div className="flex justify-center px-5 pt-4 pb-12">
      <Rise className="grid w-full max-w-105 gap-6">
        <div className="grid justify-items-center gap-4 text-center">
          <MomentTile icon={icon} tint={tint} size="xl" />
          <div className="grid gap-2">
            <h1 className="m-0 text-heading">{title}</h1>
            <p className="m-0 text-text-2 text-pretty">{body}</p>
          </div>
        </div>
        {children}
      </Rise>
    </div>
  );
}

export function StateButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <PressLink wide href={href} className={cn(buttonVariants({ size: "lg", fullWidth: true }), "h-13")}>
      {children}
    </PressLink>
  );
}
