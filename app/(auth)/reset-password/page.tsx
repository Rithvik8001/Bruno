import type { Metadata } from "next";
import { firstParam } from "@/lib/auth/redirect";
import { authParams } from "@/lib/auth/rules";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { AuthFrame } from "../_components/auth-frame";
import { authCopy } from "../_data";
import { resetCopy } from "./_data";
import { ResetFlow } from "./_components/reset-flow";

export const metadata: Metadata = {
  title: resetCopy.metaTitle,
};

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  await redirectIfSignedIn();
  const email = firstParam((await searchParams)[authParams.email]) ?? "";
  return (
    <AuthFrame back={authCopy.back.signIn}>
      <ResetFlow initialEmail={email.trim()} />
    </AuthFrame>
  );
}
