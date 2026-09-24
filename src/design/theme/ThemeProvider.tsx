import { useColorScheme } from "react-native";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { themes } from "../tokens";
import type { ThemeName } from "../types";
import {
  ThemeContext,
  type AppearancePreference,
  type ThemeContextValue,
} from "./ThemeContext";
import { AccessibilityProvider } from "./useAccessibility";

export type ThemeProviderProps = {
  children: ReactNode;
  initialPreference?: AppearancePreference;
  onPreferenceChange?: (preference: AppearancePreference) => void;
};

export function ThemeProvider({
  children,
  initialPreference = "system",
  onPreferenceChange,
}: ThemeProviderProps) {
  const system = useColorScheme();
  const [preference, setPreferenceState] =
    useState<AppearancePreference>(initialPreference);

  const setPreference = useCallback(
    (next: AppearancePreference) => {
      setPreferenceState(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange],
  );

  const themeName: ThemeName =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeName], themeName, preference, setPreference }),
    [themeName, preference, setPreference],
  );

  return (
    <ThemeContext value={value}>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </ThemeContext>
  );
}
