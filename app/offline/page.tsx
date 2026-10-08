import type { Metadata } from "next";
import { offlineCopy } from "@/lib/pwa/messages";
import { OfflineScreen } from "./_components/offline-screen";

export const dynamic = "force-static";

export const metadata: Metadata = { title: offlineCopy.metaTitle, robots: { index: false } };

export default function OfflinePage() {
  return <OfflineScreen />;
}
