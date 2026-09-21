import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, labelsHidden } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { T } from "../primitives/T";
import { useTheme, useThemeName } from "../theme/useTheme";

export type DateRowProps = {
  label: string;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (value: Date) => void;
  last?: boolean;
};

export function DateRow({
  label,
  value,
  minimumDate,
  maximumDate,
  onChange,
  last = false,
}: DateRowProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <View
      style={{
        minHeight: layout.row,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <T style="row" override={{ flex: 1 }} numberOfLines={1}>
        {label}
      </T>
      <Host matchContents colorScheme={themeName} seedColor={theme.ink}>
        <DatePicker
          title={label}
          selection={value}
          range={{ start: minimumDate, end: maximumDate }}
          displayedComponents={["date"]}
          onDateChange={onChange}
          modifiers={[datePickerStyle("compact"), labelsHidden()]}
        />
      </Host>
    </View>
  );
}
