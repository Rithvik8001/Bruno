import { Pressable, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Hairline } from "../primitives/Hairline";
import { T } from "../primitives/T";

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
  const travel = layout.toggle.width - layout.toggle.knob - layout.toggle.inset * 2;

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={{
        top: (layout.hit - layout.toggle.height) / 2,
        bottom: (layout.hit - layout.toggle.height) / 2,
        left: 0,
        right: 0,
      }}
      style={{
        width: layout.toggle.width,
        height: layout.toggle.height,
        borderRadius: layout.toggle.radius,
        padding: layout.toggle.inset,
        justifyContent: "center",
        backgroundColor: value ? theme.ink : theme.surface2,
        borderWidth: value ? 0 : layout.hairline,
        borderColor: theme.border2,
        opacity: disabled ? layout.money.minimumScale : 1,
      }}
    >
      <View
        style={{
          width: layout.toggle.knob - (value ? 0 : layout.hairline * 2),
          height: layout.toggle.knob - (value ? 0 : layout.hairline * 2),
          borderRadius: layout.toggle.knob / 2,
          backgroundColor: value ? theme.onInk : theme.canvas,
          borderWidth: value ? 0 : layout.hairline,
          borderColor: theme.border2,
          transform: [{ translateX: value ? travel : 0 }],
        }}
      />
    </Pressable>
  );
}

export type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
};

export function ToggleRow({
  label,
  value,
  onValueChange,
  disabled,
  last = true,
}: ToggleRowProps) {
  return (
    <>
      <View
        style={{
          minHeight: layout.row.minHeight,
          paddingHorizontal: layout.row.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <T style="bodyMedium" override={{ flex: 1 }} numberOfLines={1}>
          {label}
        </T>
        <Toggle
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          accessibilityLabel={label}
        />
      </View>
      {last ? null : <Hairline />}
    </>
  );
}
