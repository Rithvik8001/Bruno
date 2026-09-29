import type { Key, ReactNode } from "react";
import { LiveMark, LogoLink } from "@/components/brand/live-logo";
import { StepSwap } from "@/components/motion/rise";
import { routes } from "@/lib/auth/rules";

export interface AuthHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  visual?: ReactNode;
  stepKey?: Key;
}

export function AuthHeader({ title, subtitle, visual, stepKey = "static" }: AuthHeaderProps) {
  return (
    <div className="grid justify-items-center gap-3.5 text-center">
      {visual ?? (
        <LogoLink href={routes.home} aria-label="Bruno home" className="text-text no-underline hover:text-text">
          <LiveMark size={40} />
        </LogoLink>
      )}
      <StepSwap stepKey={stepKey} className="grid gap-1.5">
        <h1 className="m-0 text-heading text-balance">{title}</h1>
        <p className="m-0 text-text-2 text-pretty">{subtitle}</p>
      </StepSwap>
    </div>
  );
}
