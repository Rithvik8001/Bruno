import type { Metadata } from "next";
import { BrunoMark } from "@/components/brand/bruno-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { StatusChip } from "@/components/ui/chip";
import { BuddiesSection } from "./_sections/buddies";
import { ColourSection } from "./_sections/colour";
import { ComponentsSection } from "./_sections/components";
import { FoundationsSection } from "./_sections/foundations";
import { MicroSection } from "./_sections/micro";
import { PrinciplesSection } from "./_sections/principles";
import { TokensSection } from "./_sections/tokens";
import { TypeSection } from "./_sections/type";

export const metadata: Metadata = {
  title: "Design system",
  description: "Bruno design system v2 — tokens, type, components and micro-interactions.",
};

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-landing px-6 pt-7 pb-24">
      <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <BrunoMark size={30} />
          <span className="text-[1.0625rem] leading-6 font-semibold tracking-[-0.01em]">Bruno</span>
          <span className="text-small text-muted">Design system · v2</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="max-w-160 pt-16 pb-10">
        <StatusChip status="settled" className="mb-6" />
        <h1 className="m-0 mb-4 text-display text-pretty">Split the bill, not friendships.</h1>
        <p className="m-0 max-w-[56ch] text-lead text-pretty text-text-2">
          Neutral canvas, colour that names things. Statuses, people and groups each get a soft tint with a
          saturated icon and label. Everything else is warm grey, near-black type and generous radius.
        </p>
      </div>

      <PrinciplesSection />
      <ColourSection />
      <TypeSection />
      <FoundationsSection />
      <BuddiesSection />
      <ComponentsSection />
      <MicroSection />
      <TokensSection />

      <footer className="flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-footnote text-muted">
        <span>Bruno design system · v2</span>
        <span>Next: sign up, sign in, home.</span>
      </footer>
    </div>
  );
}
