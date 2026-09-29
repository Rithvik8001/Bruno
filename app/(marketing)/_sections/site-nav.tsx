import { LiveMark, LogoLink } from "@/components/brand/live-logo";
import { PressLink } from "@/components/motion/motion-link";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils/cn";
import { navLinks, routes } from "../_data";
import { NavLink } from "../_components/primitives";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-landing items-center justify-between gap-4 border-x border-line px-5 sm:px-8">
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
        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <NavLink href={routes.signIn} className="hidden min-[720px]:inline-flex">
            Sign in
          </NavLink>
          <PressLink href={routes.signUp} className={cn(buttonVariants({ size: "sm" }), "h-9 px-3.5")}>
            Get started
          </PressLink>
        </div>
      </div>
    </header>
  );
}
