import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/auth/rules";
import { signInPath, withNext } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils/cn";
import { claimCopy } from "../_data";

export function SignedOutActions({ returnTo }: { returnTo: string }) {
  return (
    <div className="grid gap-2">
      <PressLink wide href={signInPath(returnTo)} className={cn(buttonVariants({ size: "lg", fullWidth: true }), "h-13")}>
        {claimCopy.signIn}
      </PressLink>
      <PressLink wide href={withNext(routes.signUp, returnTo)} className={cn(buttonVariants({ variant: "secondary", size: "lg", fullWidth: true }), "font-semibold")}>
        {claimCopy.signUp}
      </PressLink>
      <p className="m-0 mt-1 text-center text-footnote text-muted">{claimCopy.comeBack}</p>
    </div>
  );
}
