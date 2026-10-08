"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { MomentTile } from "@/components/ui/icon-3d";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useDevice } from "@/lib/hooks/use-device";
import { usePush } from "@/lib/hooks/use-push";
import { EASE, T } from "@/lib/motion/tokens";
import { optInCopy, type OptInCopy } from "@/lib/pwa/messages";
import { isSnoozed, snooze, type SnoozeKey } from "@/lib/pwa/snooze";
import { InstallSheet } from "./install-sheet";

const GRANTED_HOLD_MS = 2400;

type Phase = "ask" | "granted" | "denied" | "gone";

const noop = () => () => undefined;

export interface PushOptInCardProps {
  copy: OptInCopy;
  snoozeKey: SnoozeKey;
}

export function PushOptInCard({ copy, snoozeKey }: PushOptInCardProps) {
  const { toast } = useToast();
  const push = usePush();
  const device = useDevice() ?? "other";
  const snoozed = useSyncExternalStore(noop, () => isSnoozed(snoozeKey), () => true);
  const [phase, setPhase] = useState<Phase>("ask");
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    if (phase !== "granted") return undefined;
    const timer = setTimeout(() => setPhase("gone"), GRANTED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const eligible = push.state === "off" || push.state === "needsInstall";
  const visible = phase === "granted" || phase === "denied" || (phase === "ask" && eligible && !snoozed);

  const later = () => {
    snooze(snoozeKey);
    setPhase("gone");
  };

  const turnOn = async () => {
    const result = await push.enable();
    if (!result.ok) {
      toast({ message: result.error.message });
      return;
    }
    if (result.data === "on") setPhase("granted");
    else if (result.data === "blocked") setPhase("denied");
  };

  const ios = push.state === "needsInstall";

  return (
    <>
      <AnimatePresence initial={false}>
        {visible && (
          <motion.section
            key="opt-in"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: T.t3, ease: EASE }}
            aria-live="polite"
            className="grid gap-3 rounded-card bg-surface p-4"
          >
            {phase === "granted" ? (
              <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3">
                <MomentTile icon="check" tint="green" size="sm" className="size-10" />
                <span className="grid min-w-0">
                  <span className="font-semibold">{optInCopy.granted(device)}</span>
                  <span className="text-small text-text-2">{copy.grantedBody}</span>
                </span>
              </div>
            ) : phase === "denied" ? (
              <>
                <div className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3">
                  <MomentTile icon="warning" tint="amber" size="sm" className="size-10" />
                  <span className="grid min-w-0">
                    <span className="font-semibold">{optInCopy.blocked.title}</span>
                    <span className="text-small text-text-2 text-pretty">{optInCopy.blocked.body}</span>
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button variant="tertiary" size="md" onClick={() => setPhase("gone")}>
                    {optInCopy.blocked.gotIt}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3">
                  <MomentTile icon={ios ? "phone" : "bell"} tint={ios ? "blue" : "violet"} size="sm" className="size-10" />
                  <span className="grid min-w-0">
                    <span className="font-semibold">{copy.title}</span>
                    {push.pending ? (
                      <span className="flex items-center gap-1.5 text-small font-medium text-brand">
                        <Spinner className="size-3 border-[1.5px]" label={optInCopy.waiting} />
                        {optInCopy.waiting}
                      </span>
                    ) : (
                      <span className="text-small text-text-2 text-pretty">{ios ? optInCopy.ios.body : copy.body}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="tertiary" size="md" onClick={later} disabled={push.pending}>
                    {optInCopy.notNow}
                  </Button>
                  <Button size="md" loading={push.pending} onClick={() => (ios ? setSteps(true) : void turnOn())}>
                    {ios ? optInCopy.ios.cta : optInCopy.turnOn}
                  </Button>
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
      <InstallSheet open={steps} onOpenChange={setSteps} />
    </>
  );
}
