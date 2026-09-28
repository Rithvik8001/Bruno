import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import type { AuthBackLink } from "../_data";

export interface AuthFrameProps {
  back: AuthBackLink;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthFrame({ back, footer, children }: AuthFrameProps) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href={back.href}
          className="inline-flex h-9 items-center gap-2 rounded-sm pr-2.5 pl-1.5 text-small font-medium text-text-2 no-underline transition-colors hover:bg-surface hover:text-text"
        >
          <Icon name="chevron-left" size={18} />
          {back.label}
        </Link>
        <ThemeSwitch />
      </header>
      <main className="flex items-start justify-center px-5 pt-6 pb-12">
        <div className="grid w-full max-w-100 gap-7">{children}</div>
      </main>
      {footer ? <footer className="px-5 py-4 text-center text-footnote text-muted">{footer}</footer> : <span />}
    </div>
  );
}
