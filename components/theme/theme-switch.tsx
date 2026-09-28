"use client";

import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils/cn";

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setPreference } = useTheme();
  return (
    <IconButton
      icon="contrast"
      label="Toggle theme"
      className={cn("size-9 rounded-sm", className)}
      onClick={() => setPreference(theme === "dark" ? "light" : "dark")}
    />
  );
}
