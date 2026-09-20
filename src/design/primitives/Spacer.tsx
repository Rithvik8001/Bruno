import { View } from "react-native";

export type SpacerProps =
  { grow: true; height?: never } | { grow?: false; height: number };

export function Spacer(props: SpacerProps) {
  return (
    <View
      style={props.grow === true ? { flexGrow: 1 } : { height: props.height }}
    />
  );
}
