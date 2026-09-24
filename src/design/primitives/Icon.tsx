import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

import { icons, iconSizes, symbolWeight } from "../tokens";
import { useReduceMotion } from "../theme/useAccessibility";
import { useTheme } from "../theme/useTheme";
import type { ColorToken, IconSizeToken, IconSource, IconToken } from "../types";

export type IconProps = {
  name: IconSource;
  size?: number | IconSizeToken;
  color?: ColorToken;
  bounce?: number;
};

function isIconToken(name: IconSource): name is IconToken {
  return name in icons;
}

export function resolveSymbol(name: IconSource): SFSymbol {
  return isIconToken(name) ? icons[name] : name;
}

export function resolveIconSize(size: number | IconSizeToken): number {
  return typeof size === "number" ? size : iconSizes[size];
}

export function Icon({ name, size = "bar", color = "ink", bounce = 0 }: IconProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const resolved = resolveIconSize(size);
  const animate = bounce > 0 && !reduceMotion;

  return (
    <SymbolView
      key={animate ? bounce : 0}
      animationSpec={
        animate ? { effect: { type: "bounce", wholeSymbol: true } } : undefined
      }
      name={resolveSymbol(name)}
      size={resolved}
      weight={symbolWeight}
      type="monochrome"
      tintColor={theme[color]}
      resizeMode="scaleAspectFit"
      style={{ width: resolved, height: resolved }}
    />
  );
}
