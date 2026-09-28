import { AvatarStack } from "@/components/ui/avatar";
import { FlaggedLineDemo, ReceiptScanDemo, TearOffDemo } from "../_components/demos";
import { Demo, DemoGrid, DocSection } from "../_components/doc";
import { productPatterns, stack } from "../_data";

export function MicroSection() {
  return (
    <DocSection
      index={7}
      title="Micro-interactions"
      description="The moments that make Bruno feel alive. Claiming and rolling digits are live in 05. Everything here respects reduced motion — it falls back to instant state changes."
      contentClassName="grid gap-11"
    >
      <Demo
        title="AI reading a receipt"
        description="No progress bar. A ghost receipt with placeholder bars; a violet beam with a sparkle sweeps down. As it passes a line, the text un-blurs (6px → 0, 450ms), rises 4px and the category chip springs in. The status chip goes Reading → Found N → Ready, and the caption names what was just spotted. Total resolves last. ~4s."
      >
        <ReceiptScanDemo />
      </Demo>

      <Demo
        title="Flagged line"
        description="When AI isn't sure, the whole row becomes a soft amber block — no side stripes. Price field outlined amber, tap-to-pick guesses. Picking one fades the tint and the row rejoins the list."
      >
        <FlaggedLineDemo />
      </Demo>

      <DemoGrid>
        <Demo
          title="Avatar pop"
          description="Hover or focus an avatar in a stack: it lifts 4px, scales 1.12 on a small spring and comes to the front; an ink pill names them. Replaces native titles everywhere."
        >
          <div className="pt-9 pb-1 pl-1.5">
            <AvatarStack people={stack} size="lg" />
          </div>
        </Demo>
        <Demo
          title="Tear-off"
          description="Settling rips the stub along the perforation: rotate −6°, drift down-right, fade (520ms). The confirmation rises where it was. Used only on settle up."
        >
          <TearOffDemo />
        </Demo>
      </DemoGrid>

      <Demo title="Also in the product">
        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
          {productPatterns.map((p) => (
            <div key={p.title} className="grid gap-1 rounded-tile bg-surface px-4 py-3.5">
              <span className="flex items-center gap-2 text-small font-semibold">
                <span data-tint={p.tint} className="size-2 rounded-full bg-tint" />
                {p.title}
              </span>
              <span className="text-footnote text-text-2">{p.body}</span>
              <span className="mt-0.5 text-caption text-brand">{p.where}</span>
            </div>
          ))}
        </div>
      </Demo>
    </DocSection>
  );
}
