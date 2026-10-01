import type { Metadata } from "next";
import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/auth/rules";
import { AuthFrame } from "../_components/auth-frame";
import { AuthHeader } from "../_components/auth-header";
import { goodbyeCopy } from "./_data";

export const metadata: Metadata = { title: goodbyeCopy.metaTitle, robots: { index: false } };

export default function GoodbyePage() {
  return (
    <AuthFrame>
      <AuthHeader title={goodbyeCopy.title} subtitle={goodbyeCopy.body} />
      <PressLink href={routes.home} className={buttonVariants({ size: "lg", fullWidth: true })}>
        {goodbyeCopy.back}
      </PressLink>
    </AuthFrame>
  );
}
