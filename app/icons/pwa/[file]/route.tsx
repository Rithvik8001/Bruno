import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/bruno-mark";
import { palettes } from "@/lib/design-system/tokens";
import { findPwaIcon, PWA_ICONS } from "@/lib/pwa/icons";

export const dynamic = "force-static";
export const dynamicParams = false;

const MARK_RATIO = 45 / 44;

export function generateStaticParams() {
  return PWA_ICONS.map((icon) => ({ file: icon.file }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/icons/pwa/[file]">,
): Promise<Response> {
  const icon = findPwaIcon((await params).file);
  if (!icon) return new Response(null, { status: 404 });
  const width = Math.round(icon.size * icon.markScale);
  const ink = icon.tile
    ? palettes.light.neutral.bg
    : palettes.light.neutral.text;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: icon.tile ? palettes.light.neutral.text : "transparent",
      }}
    >
      <svg
        width={width}
        height={Math.round(width * MARK_RATIO)}
        viewBox="0 0 44 45"
        fill={ink}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
      </svg>
    </div>,
    { width: icon.size, height: icon.size },
  );
}
