const IOS_PATTERN = /iPad|iPhone|iPod/;
const IPAD_PATTERN = /iPad/;
const ANDROID_PATTERN = /Android/;
const MAC_PATTERN = /Macintosh|Mac OS X/;

export type DeviceKind = "iphone" | "ipad" | "mac" | "android" | "other";
const TOUCH_MAC_POINTS = 1;

interface StandaloneNavigator extends Navigator {
  readonly standalone?: boolean;
}

export function isIosDevice(nav: Navigator): boolean {
  return IOS_PATTERN.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > TOUCH_MAC_POINTS);
}

export function deviceKind(nav: Navigator): DeviceKind {
  const ua = nav.userAgent;
  if (IPAD_PATTERN.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > TOUCH_MAC_POINTS)) return "ipad";
  if (IOS_PATTERN.test(ua)) return "iphone";
  if (ANDROID_PATTERN.test(ua)) return "android";
  if (MAC_PATTERN.test(ua)) return "mac";
  return "other";
}

export const isPhoneLike = (kind: DeviceKind): boolean => kind === "iphone" || kind === "ipad" || kind === "android";

export const STANDALONE_QUERY = "(display-mode: standalone)";

export function isStandalone(): boolean {
  return window.matchMedia(STANDALONE_QUERY).matches || (navigator as StandaloneNavigator).standalone === true;
}

export function serviceWorkerEnabled(): boolean {
  return "serviceWorker" in navigator && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SW_DEV === "1");
}
