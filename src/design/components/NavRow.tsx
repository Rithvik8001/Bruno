import { View } from "react-native";

import { layout } from "../tokens";
import { GlassButton } from "./GlassButton";
import { IconButton } from "./IconButton";
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
};

export function NavRow({
  onBack,
  backIcon = "back",
  backAccessibilityLabel = "Back",
  action,
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
      ) : (
        <IconButton
          icon={backIcon}
          onPress={onBack}
          accessibilityLabel={backAccessibilityLabel}
        />
      )}
      {action === undefined ? (
        <View />
      ) : (
        <GlassButton title={action.title} onPress={action.onPress} />
      )}
    </View>
  );
}
