import Link from "next/link";
import { BrunoMark } from "@/components/brand/bruno-mark";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { routes } from "@/lib/auth/rules";
import { shellCopy } from "../(app)/_data";

export default function JoinLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr]">
      <header className="flex items-center justify-between px-5 py-4">
        <Link href={routes.app} aria-label={shellCopy.homeLabel} className="text-text no-underline hover:text-text">
          <BrunoMark size={28} />
        </Link>
        <ThemeSwitch />
      </header>
      <main className="flex items-start justify-center px-5 pt-8 pb-14">
        <div className="grid w-full max-w-110 gap-6">{children}</div>
      </main>
    </div>
  );
}
