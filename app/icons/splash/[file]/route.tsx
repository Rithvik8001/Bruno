import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/bruno-mark";
import { palettes } from "@/lib/design-system/tokens";
import { findSplash, SPLASH_IMAGES, SPLASH_MARK_SCALE, SPLASH_TILE_PT, SPLASH_TILE_RADIUS } from "@/lib/pwa/splash";

export const dynamic = "force-static";
export const dynamicParams = false;

const MARK_RATIO = 45 / 44;

const inks = {
  light: { page: palettes.light.neutral.bg, tile: palettes.light.neutral.text, mark: palettes.light.neutral.bg },
  dark: { page: palettes.dark.neutral.bg, tile: palettes.dark.neutral.text, mark: palettes.dark.neutral.bg },
} as const;

export function generateStaticParams() {
  return SPLASH_IMAGES.map((image) => ({ file: image.file }));
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/splash/[file]">): Promise<Response> {
  const image = findSplash((await params).file);
  if (!image) return new Response(null, { status: 404 });
  const { screen, theme } = image;
  const ink = inks[theme];
  const tile = SPLASH_TILE_PT * screen.ratio;
  const mark = Math.round(tile * SPLASH_MARK_SCALE);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: ink.page }}>
        <div
          style={{
            width: tile,
            height: tile,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Math.round(tile * SPLASH_TILE_RADIUS),
            background: ink.tile,
          }}
        >
          <svg width={mark} height={Math.round(mark * MARK_RATIO)} viewBox="0 0 44 45" fill={ink.mark}>
            <path fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
          </svg>
        </div>
      </div>
    ),
    { width: screen.width * screen.ratio, height: screen.height * screen.ratio },
  );
}
