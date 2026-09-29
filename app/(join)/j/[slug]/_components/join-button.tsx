"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { routes } from "@/lib/auth/rules";
import { joinGroup } from "@/lib/groups/actions";

export function JoinButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const join = () =>
    startTransition(async () => {
      const result = await joinGroup({ slug });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push(routes.group(result.data.id));
    });

  return (
    <div className="grid gap-3">
      {error && <InlineAlert>{error}</InlineAlert>}
      <Button size="lg" fullWidth loading={pending} onClick={join}>
        {label}
      </Button>
    </div>
  );
}
