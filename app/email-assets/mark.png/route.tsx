import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/bruno-mark";
import { palettes } from "@/lib/design-system/tokens";

export const dynamic = "force-static";

const SIZE = 112;

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: palettes.light.neutral.text,
          borderRadius: 32,
        }}
      >
        <svg width="84" height="86" viewBox="0 0 44 45" fill={palettes.light.brand["on-brand"]}>
          <path fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
