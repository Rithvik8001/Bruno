"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { routes } from "@/lib/auth/rules";
import { signInPath, withNext } from "@/lib/auth/redirect";
import { startGuestTakeover } from "@/lib/claiming/actions";
import { liveClaimCopy } from "../_data";

type Intent = "signUp" | "signIn";

export function TakeoverActions({ code }: { code: string }) {
  const copy = liveClaimCopy.finished;
  const router = useRouter();
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const go = (next: Intent) => {
    setIntent(next);
    setError(null);
    startTransition(async () => {
      const result = await startGuestTakeover({ code });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const path = result.data.claimPath;
      router.push(next === "signUp" ? withNext(routes.signUp, path) : signInPath(path));
    });
  };

  return (
    <div className="grid gap-1">
      {error && <InlineAlert className="mb-2">{error}</InlineAlert>}
      <Button size="lg" fullWidth loading={pending && intent === "signUp"} disabled={pending} onClick={() => go("signUp")}>
        {copy.getBruno}
      </Button>
      <Button
        variant="tertiary"
        fullWidth
        className="h-10 text-small"
        loading={pending && intent === "signIn"}
        disabled={pending}
        onClick={() => go("signIn")}
      >
        {copy.haveAccount}
      </Button>
    </div>
  );
}
