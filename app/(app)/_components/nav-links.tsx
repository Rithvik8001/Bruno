"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { routes } from "@/lib/auth/rules";
import { cn } from "@/lib/utils/cn";
import { appNav, shellCopy } from "../_data";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={shellCopy.mainNav} className="hidden items-center gap-0.5 nav:flex">
      {appNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-8.5 items-center rounded-sm px-3 text-small font-medium no-underline transition-colors",
              active ? "bg-surface text-text hover:text-text" : "text-text-2 hover:bg-surface hover:text-text",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label={shellCopy.mainNav}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2.5 px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] nav:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-line bg-bg p-1 shadow-float">
        {appNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={active ? undefined : item.label}
              className={cn(
                "flex h-12 items-center rounded-full no-underline transition-colors",
                active
                  ? "gap-2 bg-surface-2 pr-4.5 pl-3.5 text-small font-semibold text-text hover:text-text"
                  : "w-12 justify-center text-text-2 hover:bg-surface hover:text-text",
              )}
            >
              <Icon name={item.icon} size={20} />
              {active && item.label}
            </Link>
          );
        })}
      </div>
      <Link
        href={routes.newBill}
        aria-label={shellCopy.addBill}
        className="pointer-events-auto grid size-14.5 place-items-center rounded-full bg-brand text-on-brand no-underline shadow-float transition-colors hover:bg-brand-hover hover:text-on-brand"
      >
        <Icon name="plus" size={24} strokeWidth={2.2} />
      </Link>
    </nav>
  );
}
