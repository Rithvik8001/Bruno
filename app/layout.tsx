import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { ThemeHead } from "@/components/theme/theme-head";
import { ThemeSync } from "@/components/theme/theme-sync";
import { ToastProvider } from "@/components/ui/toast";
import { palettes } from "@/lib/design-system/tokens";
import { SPLASH_IMAGES, splashMedia, splashPath } from "@/lib/pwa/splash";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Bruno", template: "%s · Bruno" },
  description: "Split the bill, not friendships.",
  applicationName: "Bruno",
  appleWebApp: {
    capable: true,
    title: "Bruno",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH_IMAGES.map((image) => ({ url: splashPath(image), media: splashMedia(image) })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: palettes.light.neutral.bg },
    { media: "(prefers-color-scheme: dark)", color: palettes.dark.neutral.bg },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <ThemeHead />
      </head>
      <body className="min-h-dvh">
        <ThemeSync />
        <ServiceWorker />
        <MotionProvider>
          <ToastProvider>{children}</ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
