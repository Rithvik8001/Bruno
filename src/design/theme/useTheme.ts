import { use } from "react";

import type { ColorToken, Theme, ThemeName } from "../types";
import { ThemeContext, type AppearancePreference, type ThemeContextValue } from "./ThemeContext";

export function useThemeContext(): ThemeContextValue {
  const value = use(ThemeContext);
  if (value === null) {
    throw new Error("useTheme must be used inside a <ThemeProvider>.");
  }
  return value;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}

export function useThemeName(): ThemeName {
  return useThemeContext().themeName;
}

export function useAppearance(): {
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
} {
  const { preference, setPreference } = useThemeContext();
  return { preference, setPreference };
}

export function useColor(token: ColorToken): string {
  return useTheme()[token];
}
