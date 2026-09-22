import { DatePicker, HStack, Host, Spacer } from "@expo/ui/swift-ui";
import { datePickerStyle, labelsHidden } from "@expo/ui/swift-ui/modifiers";

import { useTheme, useThemeName } from "../theme/useTheme";
import { FieldShell } from "./FieldShell";

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
    <FieldShell label={label} last={last}>
      <Host
        matchContents={{ vertical: true }}
        colorScheme={themeName}
        seedColor={theme.accent}
        style={{ alignSelf: "stretch" }}
      >
        <HStack alignment="center">
          <DatePicker
            title={label}
            selection={value}
            range={{ start: minimumDate, end: maximumDate }}
            displayedComponents={["date"]}
            onDateChange={onChange}
            modifiers={[datePickerStyle("compact"), labelsHidden()]}
          />
          <Spacer />
        </HStack>
      </Host>
    </FieldShell>
  );
}
