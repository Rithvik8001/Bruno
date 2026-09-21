import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";
import { GlassSurface } from "../primitives/GlassSurface";
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
        <GlassSurface radius={layout.navRow.height / 2} interactive>
          <Tappable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            style={{
              height: layout.navRow.height,
              paddingHorizontal: layout.navRow.actionPadding,
              justifyContent: "center",
            }}
          >
            <T style="filter" color="ink">
              {action.title}
            </T>
          </Tappable>
        </GlassSurface>
      )}
    </View>
  );
}
