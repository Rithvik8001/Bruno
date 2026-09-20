import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";
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
        <Tappable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          style={{
            height: layout.hit,
            justifyContent: "center",
            marginVertical: -10,
          }}
        >
          <T style="filter" color="ink2">
            {action.title}
          </T>
        </Tappable>
      )}
    </View>
  );
}
