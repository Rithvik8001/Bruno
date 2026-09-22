import { View } from "react-native";

import { layout } from "../tokens";
import { GlassButton } from "./GlassButton";
import { IconButton } from "./IconButton";
import { NativeButton } from "./NativeButton";
import { NativeIconButton } from "./NativeIconButton";
import type { IconSource } from "../types";

export type NavRowAction = {
  title: string;
  onPress: () => void;
};

export type NavRowProps = {
  onBack?: () => void;
  backIcon?: IconSource;
  backAccessibilityLabel?: string;
  action?: NavRowAction;
  native?: boolean;
};

export function NavRow({
  onBack,
  backIcon = "back",
  backAccessibilityLabel = "Back",
  action,
  native = false,
}: NavRowProps) {
  return (
    <View
      style={{
        height: layout.navRow.height,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {onBack === undefined ? (
        <View />
      ) : native ? (
        <NativeIconButton
          icon={backIcon}
          onPress={onBack}
          accessibilityLabel={backAccessibilityLabel}
        />
      ) : (
        <IconButton
          icon={backIcon}
          onPress={onBack}
          accessibilityLabel={backAccessibilityLabel}
        />
      )}
      {action === undefined ? (
        <View />
      ) : native ? (
        <NativeButton title={action.title} onPress={action.onPress} />
      ) : (
        <GlassButton title={action.title} onPress={action.onPress} />
      )}
    </View>
  );
}
