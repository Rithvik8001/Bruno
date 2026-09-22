import { Button, Host } from "@expo/ui/swift-ui";
import { buttonStyle, frame } from "@expo/ui/swift-ui/modifiers";

import { layout } from "../tokens";
import { useTheme, useThemeName } from "../theme/useTheme";

export type NativeButtonProps = {
  title: string;
  onPress: () => void;
};

export function NativeButton({ title, onPress }: NativeButtonProps) {
  const theme = useTheme();
  const themeName = useThemeName();

  return (
    <Host
      colorScheme={themeName}
      seedColor={theme.ink}
      matchContents
      style={{ height: layout.hit }}
    >
      <Button
        label={title}
        onPress={onPress}
        modifiers={[frame({ height: layout.hit }), buttonStyle("glass")]}
      />
    </Host>
  );
}
