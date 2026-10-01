"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PressLink } from "@/components/motion/motion-link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { InlineAlert } from "@/components/ui/inline-alert";
import { authClient } from "@/lib/auth/client";
import { resetPasswordPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { lockAccount } from "@/lib/notifications/actions";
import { AuthHeader } from "../../../_components/auth-header";
import { secureCopy } from "../../_data";

export interface LockCardProps {
  token: string;
  valid: boolean;
}

export function LockCard({ token, valid }: LockCardProps) {
  const router = useRouter();
  const [expired, setExpired] = useState(!valid);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const copy = expired ? secureCopy.expired : secureCopy.ask;

  const confirm = async () => {
    setPending(true);
    setError(undefined);
    const result = await lockAccount({ token }).catch(() => null);
    if (result?.ok) {
      await authClient.signOut().catch(() => undefined);
      router.replace(resetPasswordPath(result.data.email));
      return;
    }
    setPending(false);
    if (result?.error.code === "invalid") setExpired(true);
    else setError(result?.error.message ?? secureCopy.failed);
  };

  return (
    <>
      <AuthHeader title={copy.title} subtitle={copy.subtitle} stepKey={expired ? "expired" : "ask"} />
      <div className="grid gap-4">
        {error && <InlineAlert>{error}</InlineAlert>}
        {expired ? (
          <PressLink wide href={routes.resetPassword} className={buttonVariants({ size: "lg", fullWidth: true })}>
            {copy.confirm}
          </PressLink>
        ) : (
          <Button size="lg" fullWidth loading={pending} onClick={confirm}>
            {copy.confirm}
          </Button>
        )}
      </div>
    </>
  );
}
