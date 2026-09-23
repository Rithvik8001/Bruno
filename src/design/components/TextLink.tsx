import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type TextLinkProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  size?: "caption" | "note";
};

export function TextLink({
  title,
  onPress,
  disabled = false,
  size = "caption",
}: TextLinkProps) {
  return (
    <Tappable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        height: layout.link.height,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <T
        style={size === "note" ? "note" : "captionStrong"}
        color={disabled ? "ink4" : size === "note" ? "ink3" : "ink2"}
        numberOfLines={1}
      >
        {title}
      </T>
    </Tappable>
  );
}
