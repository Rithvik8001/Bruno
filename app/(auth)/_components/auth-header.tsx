import Link from "next/link";
import type { ReactNode } from "react";
import { BrunoMark } from "@/components/brand/bruno-mark";
import { routes } from "@/lib/auth/rules";

export interface AuthHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  visual?: ReactNode;
}

export function AuthHeader({ title, subtitle, visual }: AuthHeaderProps) {
  return (
    <div className="grid justify-items-center gap-3.5 text-center">
      {visual ?? (
        <Link href={routes.home} aria-label="Bruno home" className="text-text no-underline hover:text-text">
          <BrunoMark size={40} />
        </Link>
      )}
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading text-balance">{title}</h1>
        <p className="m-0 text-text-2 text-pretty">{subtitle}</p>
      </div>
    </div>
  );
}
