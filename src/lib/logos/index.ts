export const logoDevHome = "https://logo.dev";

const imageBase = "https://img.logo.dev";
const domainPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

export const serviceKeyMaxLength = 64;

export function normalizeServiceKey(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidServiceKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 1 &&
    value.length <= serviceKeyMaxLength &&
    domainPattern.test(value)
  );
}

export type LogoTheme = "light" | "dark";

export type LogoFallback = "404" | "monogram";

export function logoUrl(
  domain: string | null,
  options: { theme: LogoTheme; px: number; fallback?: LogoFallback },
): string | null {
  const token = process.env.EXPO_PUBLIC_LOGO_DEV_KEY;
  if (domain === null || token === undefined || token.length === 0) {
    return null;
  }
  const params = new URLSearchParams({
    token,
    size: String(options.px),
    format: "png",
    theme: options.theme,
    fallback: options.fallback ?? "404",
  });
  return `${imageBase}/${encodeURIComponent(domain)}?${params.toString()}`;
}
