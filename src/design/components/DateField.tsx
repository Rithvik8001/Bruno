import { DatePicker, Host, HStack, Spacer } from "@expo/ui/swift-ui";
import { datePickerStyle, labelsHidden } from "@expo/ui/swift-ui/modifiers";
import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import { Hairline } from "../primitives/Hairline";
import { T } from "../primitives/T";

export type DateFieldProps = {
  label: string;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (value: Date) => void;
  last?: boolean;
};

export function DateField({
  label,
  value,
  minimumDate,
  maximumDate,
  onChange,
  last = false,
}: DateFieldProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <>
      <View
        style={{
          minHeight: layout.row.minHeight,
          paddingLeft: layout.row.paddingHorizontal,
          paddingRight: layout.row.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <T style="bodyMedium" numberOfLines={1}>
          {label}
        </T>
        <Host
          matchContents={{ vertical: true }}
          colorScheme={themeName}
          seedColor={theme.ink}
          style={{ flex: 1, minHeight: layout.row.minHeight, justifyContent: "center" }}
        >
          <HStack alignment="center">
            <Spacer />
            <DatePicker
              title={label}
              selection={value}
              range={{ start: minimumDate, end: maximumDate }}
              displayedComponents={["date"]}
              onDateChange={onChange}
              modifiers={[datePickerStyle("compact"), labelsHidden()]}
            />
          </HStack>
        </Host>
      </View>
      {last ? null : <Hairline />}
    </>
  );
}
