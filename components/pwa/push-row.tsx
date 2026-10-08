"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useDevice } from "@/lib/hooks/use-device";
import { usePush } from "@/lib/hooks/use-push";
import { pushRowCopy } from "@/lib/pwa/messages";
import { InstallSheet } from "./install-sheet";

const copy = pushRowCopy;

function Label({ muted = false }: { muted?: boolean }) {
  return <span className={muted ? "font-medium text-text-2" : "font-medium"}>{copy.label}</span>;
}

export function PushRow() {
  const { toast } = useToast();
  const [steps, setSteps] = useState(false);
  const device = useDevice() ?? "other";
  const push = usePush();

  const turnOn = async () => {
    const result = await push.enable();
    if (!result.ok) {
      toast({ message: result.error.message });
      return;
    }
    if (result.data === "on") toast({ message: copy.toastOn(device), tone: "success" });
  };

  const turnOff = async () => {
    const result = await push.disable();
    if (!result.ok) {
      toast({ message: result.error.message });
      return;
    }
    toast({ message: copy.toastOff, action: { label: copy.undo, onAction: () => void turnOn() } });
  };

  switch (push.state) {
    case "blocked":
      return (
        <div className="grid gap-2 py-3.5">
          <span className="flex items-center justify-between gap-3">
            <Label />
            <Chip tint="amber" size="sm" icon="alert">
              {copy.blocked.chip}
            </Chip>
          </span>
          <p className="m-0 text-footnote text-text-2">{copy.blocked.lead}</p>
          <ol className="m-0 grid list-decimal gap-1 pl-5 text-footnote text-text">
            {copy.blocked.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="m-0 text-caption text-muted">{copy.blocked.note}</p>
        </div>
      );
    case "needsInstall":
      return (
        <div className="grid gap-2.5 py-3.5">
          <span className="grid gap-0.5">
            <Label />
            <span className="text-footnote text-text-2">{copy.needsInstall.body}</span>
          </span>
          <Button variant="secondary" size="md" className="w-full min-[360px]:w-auto min-[360px]:justify-self-start" onClick={() => setSteps(true)}>
            {copy.needsInstall.cta}
          </Button>
          <InstallSheet open={steps} onOpenChange={setSteps} />
        </div>
      );
    case "unsupported":
      return (
        <div className="flex min-h-15 items-center justify-between gap-4 py-2">
          <span className="grid gap-0.5">
            <Label muted />
            <span className="text-footnote text-muted">{copy.unsupported.body}</span>
          </span>
          <Chip tint="neutral" size="sm">
            {copy.unsupported.chip}
          </Chip>
        </div>
      );
    default: {
      const on = push.state === "on";
      return (
        <Switch
          checked={on}
          pending={push.pending}
          disabled={push.state === null}
          onCheckedChange={(next) => void (next ? turnOn() : turnOff())}
          className="min-h-15 py-2"
        >
          <span className="grid gap-0.5">
            <Label />
            {push.pending ? (
              <span className="flex items-start gap-1.5 text-footnote font-medium text-brand">
                <Spinner className="mt-0.5 size-3 shrink-0 border-[1.5px]" label={copy.pending} />
                {copy.pending}
              </span>
            ) : (
              <span className="text-footnote text-text-2">{on ? copy.on : copy.off}</span>
            )}
          </span>
        </Switch>
      );
    }
  }
}
