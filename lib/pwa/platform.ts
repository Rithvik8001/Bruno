const IOS_PATTERN = /iPad|iPhone|iPod/;
const TOUCH_MAC_POINTS = 1;

interface StandaloneNavigator extends Navigator {
  readonly standalone?: boolean;
}

export function isIosDevice(nav: Navigator): boolean {
  return IOS_PATTERN.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > TOUCH_MAC_POINTS);
}

export const STANDALONE_QUERY = "(display-mode: standalone)";

export function isStandalone(): boolean {
  return window.matchMedia(STANDALONE_QUERY).matches || (navigator as StandaloneNavigator).standalone === true;
}

export function serviceWorkerEnabled(): boolean {
  return "serviceWorker" in navigator && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SW_DEV === "1");
}
