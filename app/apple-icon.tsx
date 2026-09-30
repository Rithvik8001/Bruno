import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/bruno-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1917",
        }}
      >
        <svg width="132" height="135" viewBox="0 0 44 45" fill="#FFFFFF">
          <path fillRule="evenodd" clipRule="evenodd" d={MARK_PATH} />
        </svg>
      </div>
    ),
    size,
  );
}
