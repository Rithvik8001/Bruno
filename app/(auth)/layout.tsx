import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { routes } from "@/lib/auth/rules";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href={routes.home}
          className="inline-flex h-9 items-center gap-2 rounded-sm pr-2.5 pl-1.5 text-small font-medium text-text-2 no-underline transition-colors hover:bg-surface hover:text-text"
        >
          <Icon name="chevron-left" size={18} />
          Back
        </Link>
        <ThemeSwitch />
      </header>
      <main className="flex items-start justify-center px-5 pt-6 pb-12">
        <div className="grid w-full max-w-100 gap-7">{children}</div>
      </main>
      <footer className="px-5 py-4 text-center text-footnote text-muted">
        Friends don&apos;t need an account to claim their items.
      </footer>
    </div>
  );
}
