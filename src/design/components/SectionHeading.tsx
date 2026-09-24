import { View } from "react-native";

import { layout } from "../tokens";
import type { SpaceToken } from "../types";
import { Gap } from "../primitives/Gap";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type SectionHeadingAction = {
  title: string;
  onPress: () => void;
};

export type SectionHeadingSize = "heading" | "small";

export type SectionHeadingProps = {
  title: string;
  value?: string;
  action?: SectionHeadingAction;
  size?: SectionHeadingSize;
  top?: SpaceToken | null;
  bottom?: SpaceToken;
};

export function SectionHeading({
  title,
  value,
  action,
  size = "heading",
  top = "s32",
  bottom = "s12",
}: SectionHeadingProps) {
  const small = size === "small";

  return (
    <>
      {top === null ? null : <Gap size={top} />}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: layout.row.gap,
        }}
      >
        <T
          style={small ? "label" : "heading"}
          color={small ? "ink3" : "ink"}
          numberOfLines={1}
          override={{ flex: 1 }}
          accessibilityRole="header"
        >
          {title}
        </T>
        {action !== undefined ? (
          <Tappable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            hitSlop={layout.row.gap}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: layout.select.gap,
            }}
          >
            <T style="captionStrong">{action.title}</T>
            <Icon name="chevron" size={layout.row.chevron} />
          </Tappable>
        ) : value !== undefined ? (
          <T style={small ? "label" : "num"} color="ink2" numberOfLines={1}>
            {value}
          </T>
        ) : null}
      </View>
      <Gap size={bottom} />
    </>
  );
}
