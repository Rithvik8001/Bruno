"use client";

import { usePathname } from "next/navigation";
import { PressLink } from "@/components/motion/motion-link";
import { routes } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { appNav, shellCopy } from "../_data";
import { UnreadDot } from "./unread-dot";

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function hasBadge(unread: boolean, href: string, pathname: string): boolean {
  return unread && href === routes.activity && !isActive(pathname, routes.activity);
}

export function DesktopNav({ unread }: { unread: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label={shellCopy.mainNav} className="hidden items-center gap-0.5 nav:flex">
      {appNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <PressLink
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-8.5 items-center rounded-sm px-3 text-small font-medium no-underline transition-colors",
              active ? "bg-surface text-text hover:text-text" : "text-text-2 hover:bg-surface hover:text-text",
            )}
          >
            {item.label}
            {hasBadge(unread, item.href, pathname) && <UnreadDot className="top-1.5 right-1" />}
          </PressLink>
        );
      })}
    </nav>
  );
}
