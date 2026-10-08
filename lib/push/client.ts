import { actionFail, actionOk, type ActionResult } from "@/lib/actions/errors";
import { pushPublicKey } from "@/lib/env.client";
import { pushRowCopy } from "@/lib/pwa/messages";
import { isIosDevice, isStandalone, serviceWorkerEnabled } from "@/lib/pwa/platform";
import { removePushSubscription, savePushSubscription } from "./actions";
import { pushSubscriptionSchema } from "./schema";

export type PushState = "unsupported" | "needsInstall" | "blocked" | "off" | "on";

export const PUSH_PROMPT_TIMEOUT_MS = 20_000;

function askPermission(): Promise<NotificationPermission | "timeout"> {
  return Promise.race([
    Notification.requestPermission(),
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), PUSH_PROMPT_TIMEOUT_MS)),
  ]);
}

function pushCapable(): boolean {
  return serviceWorkerEnabled() && "PushManager" in window && "Notification" in window;
}

function applicationServerKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64Url}${"=".repeat((4 - (base64Url.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function readPushState(): Promise<PushState> {
  if (!pushPublicKey()) return "unsupported";
  if (!pushCapable()) return isIosDevice(navigator) && !isStandalone() ? "needsInstall" : "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission !== "granted") return "off";
  return (await currentSubscription()) ? "on" : "off";
}

export async function enablePush(): Promise<ActionResult<PushState>> {
  const key = pushPublicKey();
  if (!key || !pushCapable()) return actionFail("conflict");
  const permission = await askPermission();
  if (permission === "timeout") return actionFail("conflict", pushRowCopy.noAnswer);
  if (permission === "denied") return actionOk("blocked");
  if (permission !== "granted") return actionOk("off");
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(key) }));
  const parsed = pushSubscriptionSchema.safeParse(subscription.toJSON());
  if (!parsed.success) {
    await subscription.unsubscribe();
    return actionFail("unknown");
  }
  const saved = await savePushSubscription(parsed.data);
  if (!saved.ok) {
    await subscription.unsubscribe();
    return saved;
  }
  return actionOk("on");
}

export async function disablePush(): Promise<ActionResult<PushState>> {
  if (!pushCapable()) return actionOk("unsupported");
  const subscription = await currentSubscription();
  if (!subscription) return actionOk("off");
  const removed = await removePushSubscription({ endpoint: subscription.endpoint });
  await subscription.unsubscribe();
  return removed.ok ? actionOk("off") : removed;
}
