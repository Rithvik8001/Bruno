import { createContext } from "react";

import type { Theme, ThemeName } from "../types";

export type AppearancePreference = "system" | ThemeName;

export type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
