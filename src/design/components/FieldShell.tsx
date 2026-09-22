import type { ReactNode } from "react";
import { View } from "react-native";

import { layout } from "../tokens";
import { useTheme } from "../theme/useTheme";
import { Gap } from "../primitives/Gap";
import { Label } from "./Label";

export type FieldShellProps = {
  label: string;
  last?: boolean;
  children: ReactNode;
};

export function FieldShell({ label, last = false, children }: FieldShellProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingTop: layout.field.paddingTop,
        paddingBottom: layout.field.paddingBottom,
        borderBottomWidth: last ? 0 : layout.hairline,
        borderBottomColor: theme.hair,
      }}
    >
      <Label>{label}</Label>
      <Gap size="s8" />
      {children}
    </View>
  );
}
