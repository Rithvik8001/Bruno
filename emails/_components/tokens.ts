import { PALETTE_TINTS, palettes, type PaletteTint } from "../../lib/design-system/tokens";

export type EmailTint = PaletteTint;

export const emailFont = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export const emailColors = {
  page: palettes.light.neutral.surface,
  card: palettes.light.neutral.bg,
  surface: palettes.light.neutral.surface,
  track: palettes.light.neutral["surface-2"],
  line: palettes.light.neutral.line,
  text: palettes.light.neutral.text,
  text2: palettes.light.neutral["text-2"],
  muted: palettes.light.neutral.muted,
  brand: palettes.light.brand.brand,
  brandTint: palettes.light.brand["brand-tint"],
  onBrand: palettes.light.brand["on-brand"],
  mark: palettes.light.neutral.text,
} as const;

const darkColors = {
  page: "#000000",
  card: "#111111",
  surface: "#1A1A1A",
  track: "#383838",
  line: "#2A2A2A",
  text: palettes.dark.neutral.text,
  text2: palettes.dark.neutral["text-2"],
  link: palettes.dark.tints.violet.fg,
  brandTint: palettes.dark.brand["brand-tint"],
} as const;

export const emailTints = palettes.light.tints;

const darkTintRules = PALETTE_TINTS.map((tint) => {
  const { bg, fg } = palettes.dark.tints[tint];
  return `.e-bg-${tint}{background:${bg} !important}.e-fg-${tint}{color:${fg} !important}.e-fill-${tint}{background:${fg} !important}`;
}).join("");

export const emailCss = [
  "@media (max-width:620px){.e-px{padding-left:24px !important;padding-right:24px !important}.e-wrap{border-radius:0 !important}.e-tile{width:40px !important;height:52px !important;font-size:24px !important;line-height:52px !important}}",
  `@media (prefers-color-scheme:dark){.e-page{background:${darkColors.page} !important}.e-card{background:${darkColors.card} !important}.e-surface{background:${darkColors.surface} !important}.e-track{background:${darkColors.track} !important}.e-line{background:${darkColors.line} !important}.e-text{color:${darkColors.text} !important}.e-text2{color:${darkColors.text2} !important}.e-link{color:${darkColors.link} !important}.e-brandtint{background:${darkColors.brandTint} !important}.e-ring{border-color:${darkColors.card} !important}${darkTintRules}}`,
].join("");
