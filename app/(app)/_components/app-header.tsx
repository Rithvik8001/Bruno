import Link from "next/link";
import { BrunoMark } from "@/components/brand/bruno-mark";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/auth/rules";
import type { PersonView } from "@/lib/people/person";
import { cn } from "@/lib/utils/cn";
import { shellCopy } from "../_data";
import { DesktopNav } from "./nav-links";

export function AppHeader({ person }: { person: PersonView }) {
  return (
    <header className="sticky top-0 z-20 bg-bg">
      <div className="mx-auto flex h-16 max-w-app items-center gap-5 px-5">
        <Link
          href={routes.app}
          aria-label={shellCopy.homeLabel}
          className="flex items-center gap-2 text-body font-semibold tracking-[-0.01em] text-text no-underline hover:text-text"
        >
          <BrunoMark size={26} />
          {shellCopy.brand}
        </Link>
        <DesktopNav />
        <span className="flex-1" />
        <Link
          href={routes.newBill}
          className={cn(buttonVariants({ size: "md" }), "hidden h-9 gap-1.5 pr-3.5 pl-2.5 text-small nav:inline-flex")}
        >
          <Icon name="plus" size={18} strokeWidth={2.2} />
          {shellCopy.addBill}
        </Link>
        <Link
          href={routes.settings}
          aria-label={shellCopy.settings}
          className="rounded-full transition-shadow hover:shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--border)]"
        >
          <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="lg" />
        </Link>
      </div>
    </header>
  );
}
