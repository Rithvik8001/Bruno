"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/lib/hooks/use-device";
import { useInstall } from "@/lib/hooks/use-install";
import { installRowCopy } from "@/lib/pwa/messages";
import { isPhoneLike } from "@/lib/pwa/platform";
import { InstallSheet } from "./install-sheet";

const copy = installRowCopy;

export function InstallRow() {
  const { route, install } = useInstall();
  const [steps, setSteps] = useState(false);
  const device = useDevice();
  if (route !== "prompt" && route !== "ios") return null;
  const sub = route === "ios" ? copy.ios : device && isPhoneLike(device) ? copy.promptPhone : copy.promptDesktop;

  return (
    <div className="flex min-h-15 items-center justify-between gap-4 py-2">
      <span className="grid gap-0.5">
        <span className="font-medium">{copy.label}</span>
        <span className="text-footnote text-text-2">{sub}</span>
      </span>
      <Button variant="elevated" size="sm" className="h-10 px-3.5 pointer-coarse:h-11" onClick={() => (route === "ios" ? setSteps(true) : void install())}>
        {route === "ios" ? copy.showMe : copy.install}
      </Button>
      <InstallSheet open={steps} onOpenChange={setSteps} />
    </div>
  );
}
