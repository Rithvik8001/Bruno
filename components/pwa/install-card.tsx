"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MomentTile } from "@/components/ui/icon-3d";
import { useDevice } from "@/lib/hooks/use-device";
import { useInstall } from "@/lib/hooks/use-install";
import { EASE, T } from "@/lib/motion/tokens";
import { installCardCopy } from "@/lib/pwa/messages";
import { isPhoneLike } from "@/lib/pwa/platform";
import { isSnoozed, snooze } from "@/lib/pwa/snooze";
import { InstallSheet } from "./install-sheet";

const SWIPE_DISMISS_PX = 80;
const noop = () => () => undefined;

export function InstallCard({ className }: { className?: string }) {
  const { route, install } = useInstall();
  const device = useDevice();
  const snoozed = useSyncExternalStore(noop, () => isSnoozed("installCard"), () => true);
  const [hidden, setHidden] = useState(false);
  const [steps, setSteps] = useState(false);

  const visible = !hidden && !snoozed && (route === "prompt" || route === "ios");
  const copy = device && isPhoneLike(device) ? installCardCopy.phone : installCardCopy.desktop;

  const dismiss = () => {
    snooze("installCard");
    setHidden(true);
  };

  const act = async () => {
    if (route === "ios") {
      setSteps(true);
      return;
    }
    const outcome = await install();
    if (outcome === "accepted") setHidden(true);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISMISS_PX) dismiss();
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="install"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: T.t3, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.6, right: 0 }}
            onDragEnd={onDragEnd}
            className={className}
          >
            <div className="relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-card bg-surface py-3 pr-2 pl-4 max-[359px]:pr-3">
              <MomentTile icon="phone" tint="blue" size="sm" className="size-10" />
              <span className="grid min-w-0">
                <span className="font-semibold text-pretty">{copy.title}</span>
                <span className="text-small text-text-2">
                  <span className="max-[359px]:hidden">{copy.body}</span>
                  <span className="min-[360px]:hidden">{copy.short}</span>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Button variant="elevated" size="sm" className="h-10 px-3.5 pointer-coarse:h-11 max-[359px]:after:absolute max-[359px]:after:inset-0 max-[359px]:after:content-['']" onClick={() => void act()}>
                  {copy.cta}
                </Button>
                <IconButton icon="close" label={installCardCopy.dismiss} className="text-muted max-[359px]:hidden" onClick={dismiss} />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InstallSheet open={steps} onOpenChange={setSteps} />
    </>
  );
}
