import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { useReduceMotion } from "../theme/useAccessibility";
import { T } from "../primitives/T";

const toggleDuration = 160;

const travel = layout.toggle.width - layout.toggle.knob - layout.toggle.knobInset * 2;

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
};

export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: reduceMotion ? 0 : toggleDuration,
      useNativeDriver: true,
    }).start();
  }, [value, reduceMotion, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, travel] });

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
        left: (layout.hit - layout.toggle.width) / 2,
        right: (layout.hit - layout.toggle.width) / 2,
      }}
      style={{
        width: layout.toggle.width,
        height: layout.toggle.height,
        borderRadius: layout.toggle.radius,
        padding: layout.toggle.knobInset,
        justifyContent: "center",
        backgroundColor: value ? theme.ink : theme.hair,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Animated.View
        style={{
          width: layout.toggle.knob,
          height: layout.toggle.knob,
          borderRadius: layout.toggle.knob / 2,
          backgroundColor: theme.paper,
          transform: [{ translateX }],
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

export function ToggleRow({ label, value, onValueChange, disabled, last = true }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        height: layout.row,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <T style="row" override={{ flex: 1 }} numberOfLines={1}>
        {label}
      </T>
      <Toggle
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={label}
      />
    </View>
  );
}
