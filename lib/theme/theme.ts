import { THEMES, type ThemeName } from "@/lib/design-system/tokens";

export const THEME_PREFERENCES = [...THEMES, "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_STORAGE_KEY = "bruno-theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  );
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): ThemeName {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}

export function encodeOverride(theme: ThemeName, systemDark: boolean): string {
  return `${theme}@${systemDark ? "dark" : "light"}`;
}

export function decodeOverride(raw: string | null, systemDark: boolean): ThemePreference {
  if (!raw) return "system";
  const [theme, under] = raw.split("@");
  if ((theme !== "light" && theme !== "dark") || under !== (systemDark ? "dark" : "light")) return "system";
  return theme;
}

export const themeInitScript = `(function(){try{var d=matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches,s=d?"dark":"light",k=${JSON.stringify(
  THEME_STORAGE_KEY,
)},r=localStorage.getItem(k),x=r?r.split("@"):[],o=(x[0]==="light"||x[0]==="dark")&&x[1]===s;if(r&&!o)localStorage.removeItem(k);document.documentElement.setAttribute("data-theme",o?x[0]:s)}catch(e){}})()`;
