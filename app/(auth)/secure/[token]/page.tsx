import type { Metadata } from "next";
import { readLockToken } from "@/lib/notifications/tokens";
import { AuthFrame } from "../../_components/auth-frame";
import { authCopy } from "../../_data";
import { secureCopy } from "../_data";
import { LockCard } from "./_components/lock-card";

export const metadata: Metadata = { title: secureCopy.metaTitle, robots: { index: false } };

export default async function SecurePage({ params }: PageProps<"/secure/[token]">) {
  const { token } = await params;
  return (
    <AuthFrame back={authCopy.back.home}>
      <LockCard token={token} valid={readLockToken(token) !== null} />
    </AuthFrame>
  );
}
