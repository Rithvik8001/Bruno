import { createContext } from "react";

import type { Theme, ThemeName } from "../types";
import type { AppearancePreference } from "./appearanceStorage";

export type { AppearancePreference };

export type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  preference: AppearancePreference;
  setPreference: (preference: AppearancePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
