import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Icon } from "../primitives/Icon";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type SettingsRowProps = {
  label: string;
  value?: string;
  last?: boolean;
  chevron?: boolean;
  onPress?: () => void;
};

export function SettingsRow({
  label,
  value,
  last = false,
  chevron = true,
  onPress,
}: SettingsRowProps) {
  const theme = useTheme();

  return (
    <Tappable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      accessibilityLabel={value === undefined ? label : `${label}, ${value}`}
      style={{
        height: layout.row,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <T style="row" override={{ flex: 1 }} numberOfLines={1}>
        {label}
      </T>
      {value === undefined ? null : (
        <T style="body" color="ink3" numberOfLines={1}>
          {value}
        </T>
      )}
      {chevron ? (
        <View style={{ marginLeft: layout.settingsRow.chevronGap }}>
          <Icon name="chevron" size="inline" color="ink3" />
        </View>
      ) : null}
    </Tappable>
  );
}
