"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import type { ThemeName } from "@/lib/design-system/tokens";
import {
  DARK_QUERY,
  THEME_STORAGE_KEY,
  isThemePreference,
  resolveTheme,
  type ThemePreference,
} from "./theme";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(v) ? v : "system";
  } catch {
    return "system";
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const media = matchMedia(DARK_QUERY);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) emit();
  };
  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

function persistPreference(next: ThemePreference): boolean {
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
    return true;
  } catch {
    return false;
  }
}

const getSystemDark = () => matchMedia(DARK_QUERY).matches;

function applyTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export interface UseThemeResult {
  preference: ThemePreference;
  theme: ThemeName;
  setPreference: (next: ThemePreference) => void;
}

export function useTheme(): UseThemeResult {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);
  const systemDark = useSyncExternalStore(subscribe, getSystemDark, () => false);
  const theme = resolveTheme(preference, systemDark);

  useLayoutEffect(() => {
    applyTheme(resolveTheme(readPreference(), getSystemDark()));
  }, [preference, systemDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    persistPreference(next);
    applyTheme(resolveTheme(next, getSystemDark()));
    emit();
  }, []);

  return { preference, theme, setPreference };
}
