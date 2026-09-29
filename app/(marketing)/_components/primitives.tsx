import type { ComponentProps, ReactNode } from "react";
import { PressLink, type PressLinkProps } from "@/components/motion/motion-link";
import { Avatar, type StackPerson } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { BuddyPop, type PopTrigger } from "./buddy-pop";

export function Frame({
  children,
  className,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto max-w-landing border-x border-line px-5 sm:px-8", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeading({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2
      id={id}
      className={cn("m-0 text-[2rem] leading-9.5 font-semibold tracking-[-0.02em] text-pretty", className)}
    >
      {children}
    </h2>
  );
}

export function SectionLead({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[1rem] leading-6.5 text-pretty text-text-2">{children}</p>;
}

export function FeaturePills({ features }: { features: readonly string[] }) {
  return (
    <ul className="m-0 mt-5.5 flex list-none flex-wrap gap-1.5 p-0">
      {features.map((f) => (
        <li
          key={f}
          className="inline-flex h-7.5 items-center rounded-sm bg-surface px-2.75 text-footnote font-medium whitespace-nowrap text-text-2"
        >
          {f}
        </li>
      ))}
    </ul>
  );
}

export function AvatarRow({
  people,
  pop,
  className,
}: {
  people: readonly StackPerson[];
  pop?: PopTrigger;
  className?: string;
}) {
  return (
    <span className={cn("flex pl-1.5", className)}>
      {people.map((p, i) => {
        const avatar = (
          <Avatar
            key={p.id}
            name={p.name}
            initials={p.initials}
            tint={p.tint}
            size="sm"
            className={cn("ring-2 ring-surface", !pop && "-ml-1.5")}
          />
        );
        if (!pop) return avatar;
        return (
          <BuddyPop key={p.id} trigger={pop} index={i} className="-ml-1.5 inline-flex">
            {avatar}
          </BuddyPop>
        );
      })}
    </span>
  );
}

export const navLinkClass =
  "inline-flex h-9 items-center rounded-sm px-3 text-small font-medium text-text-2 no-underline transition-colors hover:bg-surface hover:text-text";

export function NavLink({ className, ...rest }: PressLinkProps) {
  return <PressLink className={cn(navLinkClass, className)} {...rest} />;
}

export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-card bg-surface", className)}>{children}</div>;
}

export function MockRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid min-h-12.5 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-line text-small",
        className,
      )}
    >
      {children}
    </div>
  );
}
