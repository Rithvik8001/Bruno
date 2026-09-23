import { View } from "react-native";

import { layout } from "../tokens";
import { Button, type ButtonProps } from "./Button";

export type PillRowProps = {
  buttons: readonly ButtonProps[];
};

export function PillRow({ buttons }: PillRowProps) {
  return (
    <View style={{ flexDirection: "row", gap: layout.pill.gap }}>
      {buttons.map((button) => (
        <View key={button.title} style={{ flex: 1 }}>
          <Button {...button} />
        </View>
      ))}
    </View>
  );
}
