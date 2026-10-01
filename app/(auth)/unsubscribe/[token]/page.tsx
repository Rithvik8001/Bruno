import type { Metadata } from "next";
import { notificationCategoryCopy } from "@/lib/notifications/messages";
import { readUnsubscribeToken } from "@/lib/notifications/tokens";
import { AuthFrame } from "../../_components/auth-frame";
import { authCopy } from "../../_data";
import { unsubscribeCopy } from "../_data";
import { UnsubscribeCard } from "./_components/unsubscribe-card";

export const metadata: Metadata = { title: unsubscribeCopy.metaTitle, robots: { index: false } };

export default async function UnsubscribePage({ params }: PageProps<"/unsubscribe/[token]">) {
  const { token } = await params;
  const claims = readUnsubscribeToken(token);
  return (
    <AuthFrame back={authCopy.back.home}>
      <UnsubscribeCard token={token} label={claims ? notificationCategoryCopy[claims.category].label : null} />
    </AuthFrame>
  );
}
