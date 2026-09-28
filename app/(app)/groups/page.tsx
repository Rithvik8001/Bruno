import type { Metadata } from "next";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { ComingSoon } from "../_components/coming-soon";
import { groupsCopy } from "./_data";

export const metadata: Metadata = { title: groupsCopy.metaTitle };

export default async function GroupsPage() {
  await requireAppContext(routes.groups);
  return <ComingSoon content={groupsCopy.comingSoon} />;
}
