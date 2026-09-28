import type { Metadata } from "next";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { ComingSoon } from "../_components/coming-soon";
import { activityCopy } from "./_data";

export const metadata: Metadata = { title: activityCopy.metaTitle };

export default async function ActivityPage() {
  await requireAppContext(routes.activity);
  return <ComingSoon content={activityCopy.comingSoon} />;
}
