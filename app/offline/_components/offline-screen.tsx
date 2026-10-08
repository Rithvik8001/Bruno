"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MomentTile } from "@/components/ui/icon-3d";
import { Spinner } from "@/components/ui/spinner";
import { routes } from "@/lib/auth/rules";
import { offlineCopy } from "@/lib/pwa/messages";

const RETRY_MAX_MS = 3000;
const RELOAD_DELAY_MS = 600;
const PROBE_PATH = "/manifest.webmanifest";

async function reachable(): Promise<boolean> {
  try {
    const response = await fetch(PROBE_PATH, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function resume() {
  if (window.location.pathname === routes.offline) window.location.replace(routes.app);
  else window.location.reload();
}

export function OfflineScreen() {
  const reduce = useReducedMotion();
  const [back, setBack] = useState(false);
  const [checking, setChecking] = useState(false);
  const leaving = useRef(false);

  const comeBack = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    setBack(true);
    setTimeout(resume, RELOAD_DELAY_MS);
  }, []);

  useEffect(() => {
    window.addEventListener("online", comeBack);
    return () => window.removeEventListener("online", comeBack);
  }, [comeBack]);

  const retry = async () => {
    setChecking(true);
    const started = Date.now();
    const ok = await reachable();
    if (ok) {
      comeBack();
      return;
    }
    setTimeout(() => setChecking(false), Math.max(0, RETRY_MAX_MS - (Date.now() - started)));
  };

  return (
    <main className="grid min-h-dvh place-items-center px-6 pt-safe pb-safe text-center">
      <div className="grid max-w-80 justify-items-center gap-2">
        <motion.span
          animate={back || reduce ? { y: 0 } : { y: [0, -4, 0] }}
          transition={back || reduce ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="mb-3 inline-grid"
        >
          <MomentTile icon={back ? "check" : "hourglass"} tint={back ? "green" : "amber"} size="lg" />
        </motion.span>
        <h1 className="m-0 text-title" aria-live="polite">
          {back ? offlineCopy.backTitle : offlineCopy.title}
        </h1>
        <p className="m-0 text-small text-text-2 text-pretty">{back ? offlineCopy.backBody : offlineCopy.body}</p>
        <div className="mt-4 grid min-h-12 place-items-center">
          {back ? (
            <Spinner className="text-brand" label={offlineCopy.backBody} />
          ) : (
            <Button variant="elevated" size="md" className="dark:bg-surface" loading={checking} onClick={() => void retry()}>
              {offlineCopy.retry}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
