import Storage from "expo-sqlite/kv-store";

const storageKey = "bruno.appearance";

export const appearancePreferences = ["system", "light", "dark"] as const;

export type AppearancePreference = (typeof appearancePreferences)[number];

export const defaultAppearancePreference: AppearancePreference = "system";

export function isAppearancePreference(
  value: unknown,
): value is AppearancePreference {
  return (
    typeof value === "string" &&
    (appearancePreferences as readonly string[]).includes(value)
  );
}

export function readStoredPreference(): AppearancePreference {
  try {
    const stored = Storage.getItemSync(storageKey);
    return isAppearancePreference(stored)
      ? stored
      : defaultAppearancePreference;
  } catch {
    return defaultAppearancePreference;
  }
}

export function writeStoredPreference(preference: AppearancePreference): void {
  try {
    Storage.setItemSync(storageKey, preference);
  } catch {}
}
