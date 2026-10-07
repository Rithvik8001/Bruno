import type { MetadataRoute } from "next";
import { routes } from "@/lib/auth/rules";
import { palettes } from "@/lib/design-system/tokens";
import { PWA_ICONS, pwaIconPath } from "@/lib/pwa/icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: routes.app,
    name: "Bruno",
    short_name: "Bruno",
    description: "Split the bill, not friendships.",
    start_url: routes.app,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: palettes.light.neutral.bg,
    theme_color: palettes.light.neutral.bg,
    categories: ["finance", "lifestyle"],
    icons: PWA_ICONS.filter((icon) => icon.purpose !== "monochrome").map(
      (icon) => ({
        src: pwaIconPath(icon.file),
        sizes: `${icon.size}x${icon.size}`,
        type: "image/png",
        purpose: icon.purpose,
      }),
    ),
    shortcuts: [
      { name: "Add a bill", url: routes.newBill },
      { name: "Ask Bruno", url: routes.ask },
    ],
  };
}
