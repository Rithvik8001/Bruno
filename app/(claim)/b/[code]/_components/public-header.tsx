import { LiveMark, LogoLink } from "@/components/brand/live-logo";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { routes } from "@/lib/auth/rules";
import { shellCopy } from "@/app/(app)/_data";

export function PublicHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="flex items-center justify-between px-5 py-4">
      <LogoLink
        href={signedIn ? routes.app : routes.home}
        aria-label={shellCopy.homeLabel}
        className="flex h-9 items-center gap-2 text-body font-semibold tracking-[-0.01em] text-text no-underline hover:text-text"
      >
        <LiveMark size={26} />
        {shellCopy.brand}
      </LogoLink>
      <ThemeSwitch />
    </header>
  );
}
