import type { Metadata } from "next";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { ComingSoon } from "../../_components/coming-soon";
import { newBillCopy } from "./_data";

export const metadata: Metadata = { title: newBillCopy.metaTitle };

export default async function NewBillPage() {
  await requireAppContext(routes.newBill);
  return <ComingSoon content={newBillCopy.comingSoon} />;
}
