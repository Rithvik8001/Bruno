import {
  PALETTE_TINTS,
  durations,
  easings,
  palettes,
  radii,
  typeScale,
  type ThemeName,
  type ThemePalette,
  type Tint,
} from "./tokens";

type Declarations = Readonly<Record<`--${string}`, string | number>>;

function block(selector: string, decls: Declarations): string {
  const body = Object.entries(decls)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `${selector}{${body}}`;
}

function paletteDecls(p: ThemePalette): Declarations {
  const out: Record<`--${string}`, string> = {};
  for (const [k, v] of Object.entries(p.neutral)) out[`--${k}`] = v;
  for (const [k, v] of Object.entries(p.brand)) out[`--${k}`] = v;
  for (const t of PALETTE_TINTS) {
    out[`--${t}`] = p.tints[t].fg;
    out[`--${t}-bg`] = p.tints[t].bg;
  }
  out["--elevation"] = p.shadow;
  out["--elevation-thumb"] = p.shadowThumb;
  return out;
}

function staticDecls(): Declarations {
  const out: Record<`--${string}`, string> = {};
  for (const [k, v] of Object.entries(radii)) out[`--r-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(durations)) out[`--motion-${k}`] = `${v}ms`;
  for (const [k, v] of Object.entries(easings)) out[`--motion-ease-${k}`] = v;
  for (const [k, s] of Object.entries(typeScale)) {
    out[`--fs-${k}`] = `${s.size / 16}rem`;
    out[`--lh-${k}`] = `${s.lineHeight / 16}rem`;
    out[`--ls-${k}`] = `${s.tracking}em`;
    out[`--fw-${k}`] = String(s.weight);
  }
  return out;
}

function tintSource(t: Tint): { fg: string; bg: string } {
  switch (t) {
    case "brand":
      return { fg: "var(--brand)", bg: "var(--brand-tint)" };
    case "neutral":
      return { fg: "var(--text-2)", bg: "var(--surface-2)" };
    case "muted":
      return { fg: "var(--muted)", bg: "var(--surface-2)" };
    default:
      return { fg: `var(--${t})`, bg: `var(--${t}-bg)` };
  }
}

function tintRules(): string {
  const all: readonly Tint[] = [...PALETTE_TINTS, "brand", "neutral", "muted"];
  return all
    .map((t) => {
      const { fg, bg } = tintSource(t);
      return block(`[data-tint="${t}"]`, { "--tint": fg, "--tint-bg": bg });
    })
    .join("");
}

const themeSelector = (t: ThemeName) => `:root[data-theme="${t}"]`;

export function buildThemeCss(): string {
  return [
    block(":root", { ...staticDecls(), ...paletteDecls(palettes.light) }),
    block(themeSelector("light"), paletteDecls(palettes.light)),
    block(themeSelector("dark"), paletteDecls(palettes.dark)),
    `@media (prefers-color-scheme:dark){${block(
      ":root:not([data-theme])",
      paletteDecls(palettes.dark),
    )}}`,
    tintRules(),
  ].join("\n");
}
