import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

import { icons, iconSizes, symbolWeight } from "../tokens";
import { useTheme } from "../theme/useTheme";
import type { IconSizeToken, IconSource, IconToken } from "../types";

export type IconColorToken = "ink" | "ink2" | "ink3" | "onInk" | "paper";

export type IconProps = {
  name: IconSource;
  size?: number | IconSizeToken;
  color?: IconColorToken;
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

export function Icon({ name, size = "bar", color = "ink" }: IconProps) {
  const theme = useTheme();
  const resolved = resolveIconSize(size);

  return (
    <SymbolView
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
