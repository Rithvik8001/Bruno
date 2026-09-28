import { BrunoAppIcon, BrunoLockup, BrunoMark } from "@/components/brand/bruno-mark";
import { Chip, StatusChip } from "@/components/ui/chip";
import { contrastGrade, contrastRatio, formatRatio } from "@/lib/design-system/contrast";
import {
  NEUTRAL_KEYS,
  NEUTRAL_ROLES,
  PALETTE_TINTS,
  THEMES,
  palettes,
  type Hex,
} from "@/lib/design-system/tokens";
import { DocSection, Eyebrow } from "../_components/doc";
import { tintShowcase } from "../_data";

function Ratio({ fg, bg }: { fg: Hex; bg: Hex }) {
  const r = contrastRatio(fg, bg);
  return (
    <>
      {formatRatio(r)} <span className="text-muted">{contrastGrade(r)}</span>
    </>
  );
}

const cell = "border-b border-line py-2.25";
const head = "border-b border-line py-2 font-semibold text-muted";

function TintTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-120 border-collapse text-left text-footnote">
        <thead>
          <tr>
            <th className={head}>Token</th>
            {THEMES.map((t) => (
              <th key={t} className={head}>
                {t === "light" ? "Light bg / fg" : "Dark bg / fg"}
              </th>
            ))}
            {THEMES.map((t) => (
              <th key={`${t}-r`} className={head}>
                fg on bg · {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PALETTE_TINTS.map((k) => (
            <tr key={k}>
              <td className={cell}>
                <span className="flex items-center gap-2">
                  <span data-tint={k} className="size-2.5 rounded-full bg-tint" />
                  --{k}
                </span>
              </td>
              {THEMES.map((t) => (
                <td key={t} className={`${cell} text-text-2`}>
                  {palettes[t].tints[k].bg} / {palettes[t].tints[k].fg}
                </td>
              ))}
              {THEMES.map((t) => (
                <td key={`${t}-r`} className={cell}>
                  <Ratio fg={palettes[t].tints[k].fg} bg={palettes[t].tints[k].bg} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Brand() {
  return (
    <div>
      <Eyebrow>Brand</Eyebrow>
      <div className="flex gap-2">
        <div className="flex h-18 flex-1 flex-col justify-end rounded-tile bg-brand p-3 text-caption text-on-brand">
          brand
          <span className="font-normal opacity-85">
            {palettes.light.brand.brand} · {palettes.dark.brand.brand}
          </span>
        </div>
        <div className="flex h-18 flex-1 flex-col justify-end rounded-tile bg-brand-tint p-3 text-caption text-brand">
          brand-tint
          <span className="font-normal opacity-85">
            {palettes.light.brand["brand-tint"]} · {palettes.dark.brand["brand-tint"]}
          </span>
        </div>
      </div>
      <p className="mt-2.5 mb-0 text-footnote text-text-2">
        Primary button, links, focus ring, selected state. White on brand:{" "}
        {THEMES.map((t, i) => (
          <span key={t}>
            {i > 0 && " · "}
            {t} <Ratio fg={palettes[t].brand["on-brand"]} bg={palettes[t].brand.brand} />
          </span>
        ))}
        .
      </p>

      <Eyebrow className="mt-5">Mark</Eyebrow>
      <div className="flex flex-wrap items-center gap-4">
        <BrunoMark size={44} />
        <BrunoAppIcon />
        <BrunoLockup />
      </div>
      <p className="mt-2.5 mb-0 text-footnote text-text-2">
        Always ink on canvas; inverted on an ink tile for the app icon. Never on brand or a tint.
      </p>
    </div>
  );
}

function Neutrals() {
  return (
    <div>
      <Eyebrow>Neutrals</Eyebrow>
      <div className="grid grid-cols-8 gap-1">
        {NEUTRAL_KEYS.map((k) => (
          <div key={k} className="aspect-[1/1.3] rounded-sm border border-line" style={{ background: `var(--${k})` }} />
        ))}
      </div>
      <div className="mt-2.5 grid gap-1 text-footnote">
        {NEUTRAL_KEYS.map((k) => (
          <div key={k} className="flex justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-[3px] border border-line" style={{ background: `var(--${k})` }} />
              --{k} <span className="text-muted">{NEUTRAL_ROLES[k]}</span>
            </span>
            <span className="flex-none whitespace-nowrap text-text-2">
              {palettes.light.neutral[k]} · {palettes.dark.neutral[k]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColourSection() {
  return (
    <DocSection
      index={2}
      title="Colour"
      description="Nine tints, each a bg + fg pair that works on both themes. One brand violet for actions. Neutrals carry the page. Ratios are computed from the tokens."
      contentClassName="grid gap-8"
    >
      <div>
        <Eyebrow>Tints — the reference chip, as a token</Eyebrow>
        <div className="flex flex-wrap gap-2.5">
          {PALETTE_TINTS.map((t) => {
            const status = tintShowcase[t];
            return status ? (
              <StatusChip key={t} status={status} size="lg" />
            ) : (
              <Chip key={t} tint={t} icon="users" size="lg">
                Group
              </Chip>
            );
          })}
        </div>
        <TintTable />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-6">
        <Brand />
        <Neutrals />
      </div>
    </DocSection>
  );
}
