import { buildThemeCss } from "@/lib/design-system/theme-css";
import { DocSection } from "../_components/doc";

const generatedCss = buildThemeCss()
  .replace(/;/g, ";\n  ")
  .replace(/\{/g, " {\n  ")
  .replace(/\s*\}/g, "\n}\n");

const usage = `import { Button, StatusChip, AmountChip } from "@/components/ui";
import { cents } from "@/lib/money";

<StatusChip status="settled" />
<AmountChip amount={cents(1240)} />
<Button variant="secondary">Remind Sam</Button>

<span data-tint="indigo" className="bg-tint-bg text-tint">
  Lisbon trip
</span>

bg-bg  bg-surface  bg-surface-2  border-line  border-border
text-text  text-text-2  text-muted  bg-brand  bg-brand-tint
bg-{tint}  bg-{tint}-bg  text-{tint}   ·   bg-tint  bg-tint-bg
text-display  text-heading  text-title  text-lead
text-body  text-small  text-footnote  text-caption
rounded-xs  rounded-sm  rounded-control  rounded-tile  rounded-card
shadow-float  shadow-thumb  ease-standard  ease-spring
max-w-app  max-w-landing`;

const pre =
  "m-0 max-h-130 overflow-auto rounded-card bg-surface p-4 font-mono text-caption leading-4.5 font-normal whitespace-pre text-text-2";

export function TokensSection() {
  return (
    <DocSection
      index={8}
      title="Tokens"
      description="Typed in lib/design-system/tokens.ts, emitted as CSS variables, mapped to Tailwind utilities in globals.css. This page runs on the same variables."
      contentClassName="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4"
    >
      <pre className={pre}>{generatedCss}</pre>
      <pre className={pre}>{usage}</pre>
    </DocSection>
  );
}
