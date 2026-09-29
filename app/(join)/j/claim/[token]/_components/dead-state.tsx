import { PressLink } from "@/components/motion/motion-link";
import { Rise } from "@/components/motion/rise";
import { buttonVariants } from "@/components/ui/button-variants";
import { MomentTile } from "@/components/ui/icon-3d";
import type { MomentIconId } from "@/lib/design-system/icons3d";
import type { Tint } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils/cn";

export interface DeadStateProps {
  icon: MomentIconId;
  tint: Tint;
  title: string;
  body: string;
  howTitle: string;
  steps: readonly string[];
  cta: string;
  href: string;
}

export function DeadState({ icon, tint, title, body, howTitle, steps, cta, href }: DeadStateProps) {
  return (
    <Rise className="grid gap-6">
      <div className="grid justify-items-center gap-4 text-center">
        <MomentTile icon={icon} tint={tint} size="xl" />
        <div className="grid gap-2">
          <h1 className="m-0 text-heading text-balance">{title}</h1>
          <p className="m-0 text-text-2 text-pretty">{body}</p>
        </div>
      </div>
      <div className="grid gap-3 rounded-card bg-surface p-4">
        <span className="text-small font-semibold">{howTitle}</span>
        <ol className="m-0 grid list-none gap-3 p-0">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-small text-text-2">
              <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-bg text-caption text-text">{i + 1}</span>
              <span className="pt-px text-pretty">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <PressLink wide href={href} className={cn(buttonVariants({ size: "lg", fullWidth: true }), "h-13")}>
        {cta}
      </PressLink>
    </Rise>
  );
}
