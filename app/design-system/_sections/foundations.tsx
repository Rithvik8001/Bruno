import { Icon, type IconName } from "@/components/icons/icon";
import { layout, radii, spacing } from "@/lib/design-system/tokens";
import { EASE, SPRING, SPRING_CURVE, T } from "@/lib/motion/tokens";
import { DocSection, Eyebrow, Panel, SpecRow } from "../_components/doc";

const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;

const sampleIcons: readonly IconName[] = ["plus", "search", "calendar", "clock", "receipt", "users", "check", "close"];

export function FoundationsSection() {
  return (
    <DocSection
      index={4}
      title="Space, shape, motion, icons"
      description="4px grid. Radii 10 and 20. One soft shadow for things that float. Hugeicons rounded at 1.8px, duotone: closed shapes get a 16% fill of the icon colour. 3D objects for moments (see 05)."
      contentClassName="grid gap-7"
    >
      <div>
        <Eyebrow>Spacing {spacing.join(" · ")}</Eyebrow>
        <div className="flex flex-wrap items-end gap-2">
          {spacing.map((v) => (
            <div key={v} className="grid justify-items-center gap-1.5">
              <div className="rounded-[3px] border border-brand bg-brand-tint" style={{ width: v, height: v }} />
              <span className="text-caption font-normal text-muted">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-5">
        <Panel>
          <Eyebrow>Layout</Eyebrow>
          <div className="grid gap-0.5 text-small leading-5.5">
            <SpecRow label="App flows" value={`${layout.app}px`} />
            <SpecRow label="Landing" value={`${layout.landing}px`} />
            <SpecRow label="Mobile gutter" value={`${layout.mobileGutter}px`} />
            <SpecRow label="Hit target" value={`≥${layout.minHitTarget}px`} />
          </div>
        </Panel>
        <Panel>
          <Eyebrow>Radius and elevation</Eyebrow>
          <div className="flex items-end gap-3">
            <div className="grid justify-items-center gap-1.5">
              <div className="size-12 rounded-control border border-border bg-bg" />
              <span className="text-caption font-normal text-muted">{radii.control} · controls</span>
            </div>
            <div className="grid justify-items-center gap-1.5">
              <div className="size-12 rounded-card border border-border bg-bg" />
              <span className="text-caption font-normal text-muted">{radii.card} · cards</span>
            </div>
            <div className="grid justify-items-center gap-1.5">
              <div className="h-12 w-16 rounded-card bg-bg shadow-float" />
              <span className="text-caption font-normal text-muted">float</span>
            </div>
          </div>
        </Panel>
        <Panel>
          <Eyebrow>Motion</Eyebrow>
          <div className="grid gap-0.5 text-small leading-5.5">
            <SpecRow label="Hover, focus" value={ms(T.t1)} />
            <SpecRow label="Print-in, status" value={ms(T.t2)} />
            <SpecRow label="Entrance, sheet, theme" value={ms(T.t3)} />
            <SpecRow label="Pop, check-in" value={ms(T.pop)} />
            <SpecRow label="Hero number roll" value={ms(T.roll)} />
            <SpecRow label="Ease" value={EASE.join(" ")} />
            <SpecRow label="Pop curve" value={SPRING_CURVE.join(" ")} />
            <SpecRow label="Spring" value={`${SPRING.stiffness} / ${SPRING.damping}`} />
          </div>
        </Panel>
        <Panel>
          <Eyebrow>Icons — Hugeicons, stroke rounded</Eyebrow>
          <div className="flex flex-wrap gap-3 text-text-2">
            {sampleIcons.map((n) => (
              <Icon key={n} name={n} size={22} />
            ))}
          </div>
          <p className="mt-3 mb-0 text-footnote text-text-2">
            20px in chips and rows, 24px in nav. Never mixed with filled variants.
          </p>
        </Panel>
      </div>
    </DocSection>
  );
}
