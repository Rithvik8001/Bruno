import { Host, Toggle as SwiftToggle } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  labelsHidden,
  tint,
} from "@expo/ui/swift-ui/modifiers";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import type { IconSource } from "../types";
import { IconRow } from "./IconRow";

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
};

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: ToggleProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <Host
      colorScheme={themeName}
      seedColor={theme.accent}
      style={{
        width: layout.toggle.width,
        height: layout.toggle.height,
        opacity: disabled ? layout.disabledOpacity : 1,
      }}
    >
      <SwiftToggle
        isOn={value}
        label={accessibilityLabel}
        onIsOnChange={onValueChange}
        modifiers={[labelsHidden(), tint(theme.accent), disabledModifier(disabled)]}
      />
    </Host>
  );
}

export type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: IconSource;
  subtitle?: string;
  disabled?: boolean;
};

export function ToggleRow({
  label,
  value,
  onValueChange,
  icon,
  subtitle,
  disabled,
}: ToggleRowProps) {
  return (
    <IconRow
      icon={icon}
      title={label}
      subtitle={subtitle}
      trailing={
        <Toggle
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          accessibilityLabel={label}
        />
      }
    />
  );
}
