import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type LabelProps = {
  children: string;
};

export function Label({ children }: LabelProps) {
  return (
    <T style="label" color="ink3">
      {children}
    </T>
  );
}

export type LabelRowProps = {
  label: string;
  caption?: string;
  onPressCaption?: () => void;
};

const captionHitSlop = {
  top: layout.sectionHeader.captionHitSlop,
  bottom: layout.sectionHeader.captionHitSlop,
  left: layout.sectionHeader.captionHitSlop,
  right: layout.sectionHeader.captionHitSlop,
};

export function LabelRow({ label, caption, onPressCaption }: LabelRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
      }}
    >
      <Label>{label}</Label>
      {caption === undefined ? null : onPressCaption === undefined ? (
        <T style="labelValue" color="ink3">
          {caption}
        </T>
      ) : (
        <Tappable
          onPress={onPressCaption}
          accessibilityRole="button"
          accessibilityLabel={caption}
          hitSlop={captionHitSlop}
        >
          <T style="labelValue" color="ink2">
            {caption}
          </T>
        </Tappable>
      )}
    </View>
  );
}
