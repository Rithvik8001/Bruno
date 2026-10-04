"use client";

import { useEffect, useRef } from "react";

interface NavigatorWithUAData extends Navigator {
  readonly userAgentData?: { readonly platform: string };
}

export function isApplePlatform(nav: Navigator): boolean {
  const platform = (nav as NavigatorWithUAData).userAgentData?.platform ?? nav.platform ?? nav.userAgent;
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function useCommandShortcut(key: string, onTrigger: () => void): void {
  const handler = useRef(onTrigger);
  useEffect(() => {
    handler.current = onTrigger;
  });

  useEffect(() => {
    const apple = isApplePlatform(window.navigator);
    const onKeyDown = (e: KeyboardEvent) => {
      const modifier = apple ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (!modifier || e.altKey || e.shiftKey || e.repeat) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      handler.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);
}
