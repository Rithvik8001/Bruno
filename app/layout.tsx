import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeHead } from "@/components/theme/theme-head";
import { ThemeSync } from "@/components/theme/theme-sync";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Bruno", template: "%s · Bruno" },
  description: "Split the bill, not friendships.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeHead />
      </head>
      <body className="min-h-dvh">
        <ThemeSync />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
