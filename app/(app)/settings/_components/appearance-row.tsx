"use client";

import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme/theme";
import { useTheme } from "@/lib/theme/use-theme";
import { settingsCopy } from "../_data";

const copy = settingsCopy.appearance;

const options: readonly SegmentOption<ThemePreference>[] = THEME_PREFERENCES.map((value) => ({
  value,
  label: copy.options[value],
}));

export function AppearanceRow() {
  const { preference, setPreference } = useTheme();
  return (
    <div className="flex min-h-15 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
      <span className="grid gap-0.5">
        <span className="font-medium">{copy.label}</span>
        <span className="text-footnote text-text-2">{copy.sub}</span>
      </span>
      <SegmentedControl size="sm" tone="bg" label={copy.label} options={options} value={preference} onValueChange={setPreference} />
    </div>
  );
}
