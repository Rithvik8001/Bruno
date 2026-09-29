import type { Metadata } from "next";
import { firstParam, safeNextPath } from "@/lib/auth/redirect";
import { authParams } from "@/lib/auth/rules";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { AuthFrame } from "../_components/auth-frame";
import { authCopy } from "../_data";
import { signUpCopy } from "./_data";
import { SignUpFlow } from "./_components/sign-up-flow";

export const metadata: Metadata = {
  title: signUpCopy.metaTitle,
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const next = safeNextPath(firstParam((await searchParams)[authParams.next]));
  await redirectIfSignedIn(next);
  return (
    <AuthFrame back={authCopy.back.home} footer={signUpCopy.footer}>
      <SignUpFlow next={next} />
    </AuthFrame>
  );
}
