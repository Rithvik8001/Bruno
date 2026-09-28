"use client";

import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import type { ThemeName } from "@/lib/design-system/tokens";
import { useTheme } from "@/lib/theme/use-theme";

const options: readonly SegmentOption<ThemeName>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setPreference } = useTheme();
  return (
    <SegmentedControl
      size="sm"
      label="Theme"
      options={options}
      value={theme}
      onValueChange={setPreference}
      className={className}
    />
  );
}
