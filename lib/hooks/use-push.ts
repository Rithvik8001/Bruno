"use client";

import { useCallback, useEffect, useState } from "react";
import { actionFail, type ActionResult } from "@/lib/actions/errors";
import { disablePush, enablePush, readPushState, type PushState } from "@/lib/push/client";

export interface PushControls {
  readonly state: PushState | null;
  readonly busy: boolean;
  readonly enable: () => Promise<ActionResult<PushState>>;
  readonly disable: () => Promise<ActionResult<PushState>>;
}

export function usePush(): PushControls {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    readPushState()
      .catch((): PushState => "unsupported")
      .then((next) => {
        if (live) setState(next);
      });
    return () => {
      live = false;
    };
  }, []);

  const run = useCallback(async (change: () => Promise<ActionResult<PushState>>) => {
    setBusy(true);
    try {
      const result = await change().catch((): ActionResult<PushState> => actionFail("unknown"));
      if (result.ok) setState(result.data);
      return result;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    state,
    busy,
    enable: useCallback(() => run(enablePush), [run]),
    disable: useCallback(() => run(disablePush), [run]),
  };
}
