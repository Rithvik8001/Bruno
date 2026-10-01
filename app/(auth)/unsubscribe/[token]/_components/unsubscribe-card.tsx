"use client";

import { useState } from "react";
import { PressLink } from "@/components/motion/motion-link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { InlineAlert } from "@/components/ui/inline-alert";
import { routes } from "@/lib/auth/rules";
import { unsubscribe } from "@/lib/notifications/actions";
import { AuthHeader } from "../../../_components/auth-header";
import { unsubscribeCopy } from "../../_data";

export interface UnsubscribeCardProps {
  token: string;
  label: string | null;
}

type Stage = "ask" | "done" | "expired";

export function UnsubscribeCard({ token, label }: UnsubscribeCardProps) {
  const [stage, setStage] = useState<Stage>(label ? "ask" : "expired");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const name = label ?? "";

  const confirm = async () => {
    setPending(true);
    setError(undefined);
    const result = await unsubscribe({ token }).catch(() => null);
    setPending(false);
    if (result?.ok) setStage("done");
    else if (result?.error.code === "invalid") setStage("expired");
    else setError(result?.error.message ?? unsubscribeCopy.failed);
  };

  const copy = unsubscribeCopy[stage];
  return (
    <>
      <AuthHeader
        title={copy.title}
        subtitle={typeof copy.subtitle === "string" ? copy.subtitle : copy.subtitle(name)}
        stepKey={stage}
      />
      <div className="grid gap-4">
        {error && <InlineAlert>{error}</InlineAlert>}
        {stage === "ask" ? (
          <Button size="lg" fullWidth loading={pending} onClick={confirm}>
            {unsubscribeCopy.ask.confirm}
          </Button>
        ) : (
          <PressLink
            wide
            href={routes.settingsNotifications}
            className={buttonVariants({ variant: stage === "done" ? "secondary" : "primary", size: "lg", fullWidth: true })}
          >
            {unsubscribeCopy[stage].settings}
          </PressLink>
        )}
      </div>
    </>
  );
}
