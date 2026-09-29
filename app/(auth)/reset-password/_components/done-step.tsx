"use client";

import { Icon } from "@/components/icons/icon";
import { PressLink } from "@/components/motion/motion-link";
import { buttonVariants } from "@/components/ui/button-variants";
import { routes } from "@/lib/auth/rules";
import { useCelebrateOnMount } from "../../_lib/use-celebrate";
import { resetCopy } from "../_data";
import type { ResetOutcome } from "./new-password-step";

export function DoneStep({ signedIn, signedOutCount }: ResetOutcome) {
  const copy = resetCopy.done;
  const celebrate = useCelebrateOnMount<HTMLDivElement>();
  return (
    <div ref={celebrate} className="grid gap-4">
      {signedOutCount > 0 && (
        <div className="flex items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-small text-text-2">
          <Icon name="device" size={18} className="shrink-0 text-text" />
          <span>{copy.signedOut(signedOutCount)}</span>
        </div>
      )}
      <PressLink
        wide
        href={signedIn ? routes.app : routes.signIn}
        className={buttonVariants({ size: "lg", fullWidth: true })}
      >
        {signedIn ? copy.continue : copy.signIn}
      </PressLink>
    </div>
  );
}
