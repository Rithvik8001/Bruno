import type { Metadata } from "next";
import { redirectIfSignedIn } from "@/lib/auth/session";
import { signUpCopy } from "./_data";
import { SignUpFlow } from "./_components/sign-up-flow";

export const metadata: Metadata = {
  title: signUpCopy.metaTitle,
};

export default async function SignUpPage() {
  await redirectIfSignedIn();
  return <SignUpFlow />;
}
