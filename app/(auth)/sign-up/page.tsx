import type { Metadata } from "next";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { AuthFrame } from "../_components/auth-frame";
import { authCopy } from "../_data";
import { signUpCopy } from "./_data";
import { SignUpFlow } from "./_components/sign-up-flow";

export const metadata: Metadata = {
  title: signUpCopy.metaTitle,
};

export default async function SignUpPage() {
  await redirectIfSignedIn();
  return (
    <AuthFrame back={authCopy.back.home} footer={signUpCopy.footer}>
      <SignUpFlow />
    </AuthFrame>
  );
}
