import { View } from "react-native";

import { T } from "../primitives/T";

export type LabelProps = {
  children: string;
};

export function Label({ children }: LabelProps) {
  return (
    <T style="label" color="ink3">
      {children}
    </T>
  );
}

export type LabelRowProps = {
  label: string;
  caption?: string;
};

export function LabelRow({ label, caption }: LabelRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
      }}
    >
      <Label>{label}</Label>
      {caption === undefined ? null : (
        <T style="caption" color="ink3">
          {caption}
        </T>
      )}
    </View>
  );
}
