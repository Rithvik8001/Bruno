import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, labelsHidden } from "@expo/ui/swift-ui/modifiers";

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

  return (
    <IconRow
      icon={icon}
      title={label}
      trailing={
        <Host
          matchContents={{ horizontal: true }}
          colorScheme={themeName}
          seedColor={theme.ink}
          style={{ height: layout.row.minHeight - layout.row.paddingVertical * 2 }}
        >
          <DatePicker
            title={label}
            selection={value}
            range={{ start: minimumDate, end: maximumDate }}
            displayedComponents={["date"]}
            onDateChange={onChange}
            modifiers={[datePickerStyle("compact"), labelsHidden()]}
          />
        </Host>
      }
    />
  );
}
