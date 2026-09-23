import type { TextStyle } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import {
  icons,
  iconSizes,
  logoSizes,
  radius,
  space,
  themes,
  type,
} from "./tokens";

export type ThemeName = "light" | "dark";

export type Theme = {
  readonly canvas: string;
  readonly surface: string;
  readonly surface2: string;
  readonly border: string;
  readonly ink: string;
  readonly ink2: string;
  readonly ink3: string;
  readonly ink4: string;
  readonly onInk: string;
  readonly accent: string;
  readonly accentStrong: string;
  readonly onAccent: string;
  readonly bar: string;
  readonly barMuted: string;
};

export type ColorToken = keyof Theme;

export type TypeToken = keyof typeof type;

export type SpaceToken = keyof typeof space;

export type RadiusToken = keyof typeof radius;

export type IconToken = keyof typeof icons;

export type IconSizeToken = keyof typeof iconSizes;

export type IconSource = IconToken | SFSymbol;

export type LogoSize = (typeof logoSizes)[number];

export type ChipTone = "neutral" | "accent";

export type ResolvedTextStyle = Pick<
  TextStyle,
  | "fontFamily"
  | "fontWeight"
  | "fontSize"
  | "lineHeight"
  | "letterSpacing"
  | "textTransform"
  | "fontVariant"
>;

export const colorTokens = Object.keys(themes.light) as readonly ColorToken[];

export const typeTokens = Object.keys(type) as readonly TypeToken[];

export const spaceTokens = Object.keys(space) as readonly SpaceToken[];

export const iconTokens = Object.keys(icons) as readonly IconToken[];
