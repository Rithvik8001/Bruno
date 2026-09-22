import { View } from "react-native";

import { iconSizes, layout } from "../tokens";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type DisclosureProps = {
  title: string;
  expanded: boolean;
  onToggle: () => void;
};

export function Disclosure({ title, expanded, onToggle }: DisclosureProps) {
  return (
    <Tappable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded }}
      style={{ alignSelf: "flex-start" }}
    >
      <View
        style={{
          height: layout.disclosure.height,
          flexDirection: "row",
          alignItems: "center",
          gap: layout.disclosure.gap,
        }}
      >
        <T style="filter" color="ink3">
          {title}
        </T>
        <Icon
          name={expanded ? "collapse" : "disclose"}
          size={iconSizes.tight}
          color="ink3"
        />
      </View>
    </Tappable>
  );
}
