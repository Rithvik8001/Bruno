import type { Metadata } from "next";
import { firstParam, safeNextPath } from "@/lib/auth/redirect";
import { authParams } from "@/lib/auth/rules";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { AuthFrame } from "../_components/auth-frame";
import { authCopy } from "../_data";
import { signInCopy } from "./_data";
import { SignInFlow } from "./_components/sign-in-flow";

export const metadata: Metadata = {
  title: signInCopy.metaTitle,
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const next = safeNextPath(firstParam((await searchParams)[authParams.next]));
  await redirectIfSignedIn(next);
  return (
    <AuthFrame back={authCopy.back.home} footer={signInCopy.footer}>
      <SignInFlow next={next} />
    </AuthFrame>
  );
}
