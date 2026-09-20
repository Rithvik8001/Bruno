import { layout } from "../tokens";
import { T } from "../primitives/T";
import { Tappable } from "../primitives/Tappable";

export type TextLinkProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function TextLink({ title, onPress, disabled = false }: TextLinkProps) {
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
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <T style="filter" color="ink2" numberOfLines={1}>
        {title}
      </T>
    </Tappable>
  );
}
