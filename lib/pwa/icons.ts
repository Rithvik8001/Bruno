export interface PwaIcon {
  readonly file: string;
  readonly size: number;
  readonly markScale: number;
  readonly tile: boolean;
  readonly purpose: "any" | "maskable" | "monochrome";
}

export const PWA_ICONS = [
  { file: "icon-192.png", size: 192, markScale: 0.72, tile: true, purpose: "any" },
  { file: "icon-512.png", size: 512, markScale: 0.72, tile: true, purpose: "any" },
  { file: "maskable-512.png", size: 512, markScale: 0.5, tile: true, purpose: "maskable" },
  { file: "badge-96.png", size: 96, markScale: 0.8, tile: false, purpose: "monochrome" },
] as const satisfies readonly PwaIcon[];

export type PwaIconFile = (typeof PWA_ICONS)[number]["file"];

export const pwaIconPath = (file: PwaIconFile) => `/icons/pwa/${file}`;

export function findPwaIcon(file: string): PwaIcon | null {
  return PWA_ICONS.find((icon) => icon.file === file) ?? null;
}
