import { AvatarStack } from "@/components/ui/avatar-stack";
import { BuddySelectDemo, CodeShakeDemo, FlaggedLineDemo, ReceiptScanDemo, TearOffDemo } from "../_components/demos";
import { Demo, DemoGrid, DocSection } from "../_components/doc";
import { productPatterns, stack } from "../_data";

export function MicroSection() {
  return (
    <DocSection
      index={7}
      title="Micro-interactions"
      description="Built with Motion for React: short, springy and optional. Claiming and rolling digits are live in 06. Reduced motion switches off confetti, sparkles, bursts and blinking; everything else becomes an instant state change."
      contentClassName="grid gap-11"
    >
      <Demo
        title="AI reading a receipt"
        description="No progress bar. A ghost receipt with placeholder bars; a 2px brand beam with a glow slides down and a sparkle rides it, pulsing .55 ↔ 1 every 900ms. Each line prints in (opacity 0, y −6, 220ms) and its category chip springs in from .6. The status chip goes Reading → Found N → Ready and the caption rises in with what was just spotted. Total resolves last. ~4s."
      >
        <ReceiptScanDemo />
      </Demo>

      <Demo
        title="Flagged line"
        description="When AI isn't sure, the row becomes a soft amber block that rises in — no side stripes. Price outlined amber, tap-to-pick guesses. Picking one turns the price green with a check-in, the guesses collapse away and the row rejoins the list."
      >
        <FlaggedLineDemo />
      </Demo>

      <DemoGrid>
        <Demo
          title="Avatar pop"
          description="Hover or focus an avatar in a stack: it lifts 4px, scales 1.12 on a 200ms spring and comes to the front; an ink pill names them. Replaces native titles everywhere."
        >
          <div className="pt-9 pb-1 pl-1.5">
            <AvatarStack people={stack} size="lg" />
          </div>
        </Demo>
        <Demo
          title="Tear-off"
          description="Confirming shows the button spinner, then the stub rips along the perforation: rotate −6°, x 18, y 56, fade (520ms, from the top-left). The done row rises in with a check-in, then receipt-scrap confetti. Used only on settle up."
        >
          <TearOffDemo />
        </Demo>
      </DemoGrid>

      <DemoGrid>
        <Demo
          title="Pick a buddy"
          description="Choosing a buddy or colour squishes the avatar (scaleX 1 → 1.16 → .92 → 1, 520ms) and 12 dots burst out in the new colour. Swatches lift on hover. 8ms haptic."
        >
          <BuddySelectDemo />
        </Demo>
        <Demo
          title="Wrong code"
          description="Filled cells lift 2px on a spring and tint violet. A wrong code shakes the row (x 0 → −8 → 7 → −4 → 2 → 0, 380ms) with a short error haptic, turns red, then clears."
        >
          <CodeShakeDemo />
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
