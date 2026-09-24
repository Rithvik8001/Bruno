import { View } from "react-native";

import { layout, radius } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type PillLinkProps = {
  title: string;
  onPress: () => void;
};

export function PillLink({ title, onPress }: PillLinkProps) {
  const theme = useTheme();

  return (
    <Tappable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={layout.pillLink.gap * 2}
      style={{ alignSelf: "flex-start" }}
    >
      <View
        style={{
          height: layout.pillLink.height,
          paddingHorizontal: layout.pillLink.paddingHorizontal,
          borderRadius: radius.pill,
          borderWidth: layout.hairline,
          borderColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          gap: layout.pillLink.gap,
        }}
      >
        <T style="captionStrong">{title}</T>
        <Icon name="chevron" size={layout.select.chevron} />
      </View>
    </Tappable>
  );
}
