import { View } from "react-native";

import { layout } from "../tokens";
import type { SpaceToken } from "../types";
import { Gap } from "../primitives/Gap";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type SectionLabelAction = {
  title: string;
  onPress: () => void;
};

export type SectionLabelProps = {
  title: string;
  value?: string;
  action?: SectionLabelAction;
  top?: SpaceToken | null;
  bottom?: SpaceToken;
};

export function SectionLabel({
  title,
  value,
  action,
  top = "s32",
  bottom = "s12",
}: SectionLabelProps) {
  return (
    <>
      {top === null ? null : <Gap size={top} />}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          minHeight: layout.tabs.height / 2,
        }}
      >
        <T style="label" color="ink3" numberOfLines={1} override={{ flex: 1 }}>
          {title}
        </T>
        {action !== undefined ? (
          <Tappable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            hitSlop={layout.row.paddingHorizontal}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: layout.select.gap,
            }}
          >
            <T style="caption" color="ink3">
              {action.title}
            </T>
            <Icon name="chevron" size={layout.row.chevron} color="ink4" />
          </Tappable>
        ) : value !== undefined ? (
          <T style="numLarge" color="ink" numberOfLines={1}>
            {value}
          </T>
        ) : null}
      </View>
      <Gap size={bottom} />
    </>
  );
}
