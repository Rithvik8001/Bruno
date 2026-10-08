import { LiveMark, LogoLink } from "@/components/brand/live-logo";
import { PressLink } from "@/components/motion/motion-link";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils/cn";
import { navLinks, routes } from "../_data";
import { NavLink } from "../_components/primitives";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg pt-safe">
      <div className="mx-auto flex h-16 max-w-landing items-center justify-between gap-2 border-x sm:gap-4 border-line px-5 sm:px-8">
        <LogoLink
          href={routes.home}
          aria-label="Bruno home"
          className="inline-flex items-center gap-2.5 text-text no-underline hover:text-text"
        >
          <LiveMark size={30} />
          <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">Bruno</span>
        </LogoLink>
        <nav aria-label="Primary" className="hidden gap-1 min-[720px]:flex">
          {navLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="inline-flex max-[359px]:hidden">
            <ThemeSwitch />
          </span>
          <NavLink href={routes.signIn} className="whitespace-nowrap max-[359px]:px-2">
            Sign in
          </NavLink>
          <PressLink href={routes.signUp} className={cn(buttonVariants({ size: "sm" }), "h-9 px-3.5 whitespace-nowrap")}>
            Get started
          </PressLink>
        </div>
      </div>
    </header>
  );
}
