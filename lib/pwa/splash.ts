export type SplashTheme = "light" | "dark";

export interface SplashScreen {
  readonly width: number;
  readonly height: number;
  readonly ratio: 2 | 3;
}

export const SPLASH_TILE_PT = 96;
export const SPLASH_TILE_RADIUS = 16 / 56;
export const SPLASH_MARK_SCALE = 0.72;

export const SPLASH_SCREENS = [
  { width: 440, height: 956, ratio: 3 },
  { width: 420, height: 912, ratio: 3 },
  { width: 402, height: 874, ratio: 3 },
  { width: 430, height: 932, ratio: 3 },
  { width: 393, height: 852, ratio: 3 },
  { width: 428, height: 926, ratio: 3 },
  { width: 390, height: 844, ratio: 3 },
  { width: 375, height: 812, ratio: 3 },
  { width: 414, height: 896, ratio: 3 },
  { width: 414, height: 896, ratio: 2 },
  { width: 414, height: 736, ratio: 3 },
  { width: 375, height: 667, ratio: 2 },
  { width: 1032, height: 1376, ratio: 2 },
  { width: 1024, height: 1366, ratio: 2 },
  { width: 834, height: 1210, ratio: 2 },
  { width: 834, height: 1194, ratio: 2 },
  { width: 834, height: 1112, ratio: 2 },
  { width: 820, height: 1180, ratio: 2 },
  { width: 810, height: 1080, ratio: 2 },
  { width: 768, height: 1024, ratio: 2 },
  { width: 744, height: 1133, ratio: 2 },
  { width: 320, height: 568, ratio: 2 },
] as const satisfies readonly SplashScreen[];

const THEMES = ["light", "dark"] as const satisfies readonly SplashTheme[];

export interface SplashImage {
  readonly file: string;
  readonly screen: SplashScreen;
  readonly theme: SplashTheme;
}

export const splashFile = (screen: SplashScreen, theme: SplashTheme) => `${screen.width}x${screen.height}@${screen.ratio}x-${theme}.png`;

export const splashPath = (image: SplashImage) => `/icons/splash/${image.file}`;

export const splashMedia = ({ screen, theme }: SplashImage) =>
  `(device-width: ${screen.width}px) and (device-height: ${screen.height}px) and (-webkit-device-pixel-ratio: ${screen.ratio}) and (orientation: portrait) and (prefers-color-scheme: ${theme})`;

export const SPLASH_IMAGES: readonly SplashImage[] = SPLASH_SCREENS.flatMap((screen) =>
  THEMES.map((theme) => ({ file: splashFile(screen, theme), screen, theme })),
);

export function findSplash(file: string): SplashImage | null {
  return SPLASH_IMAGES.find((image) => image.file === file) ?? null;
}
