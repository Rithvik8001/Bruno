import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/auth/rules";
import { resetCopy } from "../_data";
import type { ResetOutcome } from "./new-password-step";

export function DoneStep({ signedIn, signedOutCount }: ResetOutcome) {
  const copy = resetCopy.done;
  return (
    <div className="grid animate-rise gap-4">
      {signedOutCount > 0 && (
        <div className="flex items-center gap-3 rounded-tile bg-surface px-4 py-3.5 text-small text-text-2">
          <Icon name="device" size={18} className="shrink-0 text-text" />
          <span>{copy.signedOut(signedOutCount)}</span>
        </div>
      )}
      <Link
        href={signedIn ? routes.app : routes.signIn}
        className={buttonVariants({ size: "lg", fullWidth: true })}
      >
        {signedIn ? copy.continue : copy.signIn}
      </Link>
    </div>
  );
}
