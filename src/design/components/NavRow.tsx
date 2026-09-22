import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";
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
  plain?: boolean;
};

export function NavRow({
  onBack,
  backIcon = "back",
  backAccessibilityLabel = "Back",
  action,
  plain = false,
}: NavRowProps) {
  return (
    <View
      style={{
        height: layout.navRow.height,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: plain ? -layout.navRow.plainInset : 0,
      }}
    >
      {onBack === undefined ? (
        <View />
      ) : (
        <IconButton
          icon={backIcon}
          onPress={onBack}
          accessibilityLabel={backAccessibilityLabel}
          plain={plain}
        />
      )}
      {action === undefined ? (
        <View />
      ) : plain ? (
        <Tappable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          style={{
            height: layout.hit,
            paddingHorizontal: layout.navRow.plainInset,
            justifyContent: "center",
          }}
        >
          <T style="filter" color="ink2">
            {action.title}
          </T>
        </Tappable>
      ) : (
        <GlassButton title={action.title} onPress={action.onPress} />
      )}
    </View>
  );
}
