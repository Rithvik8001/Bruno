import type { TextStyle } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { icons, iconSizes, space, themes, type } from "./tokens";

export type ThemeName = "light" | "dark";

export type GlassShadow = {
  readonly color: string;
  readonly opacity: number;
  readonly radius: number;
  readonly offsetY: number;
};

export type Theme = {
  readonly paper: string;
  readonly ink: string;
  readonly ink2: string;
  readonly ink3: string;
  readonly hair: string;
  readonly accent: string;
  readonly onInk: string;
  readonly glass: string;
  readonly glassBorder: string;
  readonly glassPill: string;
  readonly glassShadow: GlassShadow;
};

export type ColorToken = Exclude<keyof Theme, "glassShadow">;

export type TypeToken = keyof typeof type;

export type SpaceToken = keyof typeof space;

export type IconToken = keyof typeof icons;

export type IconSizeToken = keyof typeof iconSizes;

export type IconSource = IconToken | SFSymbol;

export type ResolvedTextStyle = Pick<
  TextStyle,
  "fontFamily" | "fontSize" | "lineHeight" | "letterSpacing" | "textTransform" | "fontVariant"
>;

export const colorTokens = Object.keys(themes.light).filter(
  (key): key is ColorToken => key !== "glassShadow",
);

export const typeTokens = Object.keys(type) as readonly TypeToken[];

export const spaceTokens = Object.keys(space) as readonly SpaceToken[];

export const iconTokens = Object.keys(icons) as readonly IconToken[];
