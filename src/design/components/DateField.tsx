import { DatePicker, HStack, Host } from "@expo/ui/swift-ui";
import {
  datePickerStyle,
  frame,
  labelsHidden,
} from "@expo/ui/swift-ui/modifiers";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";
import type { IconSource } from "../types";
import { IconRow } from "./IconRow";

export type DateFieldProps = {
  label: string;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (value: Date) => void;
  icon?: IconSource;
};

export function DateField({
  label,
  value,
  minimumDate,
  maximumDate,
  onChange,
  icon,
}: DateFieldProps) {
  const theme = useTheme();
  const themeName = useThemeName();
  const controlHeight = layout.row.minHeight - layout.row.paddingVertical * 2;

  return (
    <IconRow
      icon={icon}
      title={label}
      trailing={
        <Host
          matchContents
          colorScheme={themeName}
          seedColor={theme.ink}
        >
          <HStack
            alignment="center"
            modifiers={[frame({ height: controlHeight })]}
          >
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
      }
    />
  );
}
