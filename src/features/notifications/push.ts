import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";

import { parseSubscriptionId } from "@/features/subscriptions/types";

import type { PushPermission } from "./types";

const overviewPath = "/overview";
const subscriptionPath = "/subscription";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function toPermission(
  response: Notifications.NotificationPermissionsStatus,
): PushPermission {
  const ios = response.ios?.status;
  const granted =
    response.granted ||
    ios === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    ios === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    ios === Notifications.IosAuthorizationStatus.EPHEMERAL;
  if (granted) {
    return { status: "granted", canAskAgain: response.canAskAgain };
  }
  const undetermined =
    ios === Notifications.IosAuthorizationStatus.NOT_DETERMINED ||
    (ios === undefined &&
      response.status === Notifications.PermissionStatus.UNDETERMINED);
  return {
    status: undetermined ? "undetermined" : "denied",
    canAskAgain: response.canAskAgain,
  };
}

export async function getPushPermission(): Promise<PushPermission> {
  try {
    return toPermission(await Notifications.getPermissionsAsync());
  } catch {
    return { status: "denied", canAskAgain: false };
  }
}

export async function requestPushPermission(): Promise<PushPermission> {
  try {
    return toPermission(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      }),
    );
  } catch {
    return { status: "denied", canAskAgain: false };
  }
}

function projectId(): string | null {
  const fromEas: unknown = Constants.easConfig?.projectId;
  if (typeof fromEas === "string" && fromEas.length > 0) {
    return fromEas;
  }
  const fromConfig: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof fromConfig === "string" && fromConfig.length > 0 ? fromConfig : null;
}

export type PushTokenResult =
  | { ok: true; token: string; deviceToken: string }
  | { ok: false; reason: string };

const tokenTimeoutMs = 15_000;

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = "code" in error && typeof error.code === "string" ? `${error.code}: ` : "";
    return `${code}${error.message}`;
  }
  return String(error);
}

function withTimeout<T>(task: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), tokenTimeoutMs);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

export async function getPushToken(): Promise<PushTokenResult> {
  const id = projectId();
  try {
    const devicePushToken = await withTimeout(
      Notifications.getDevicePushTokenAsync(),
      "apns",
    );
    const { data } = await withTimeout(
      Notifications.getExpoPushTokenAsync({
        devicePushToken,
        ...(id === null ? {} : { projectId: id }),
      }),
      "expo",
    );
    return { ok: true, token: data, deviceToken: devicePushToken.data };
  } catch (error) {
    return { ok: false, reason: describeError(error) };
  }
}

export function parseNotificationUrl(data: unknown): Href | null {
  if (typeof data !== "object" || data === null || !("url" in data)) {
    return null;
  }
  const url = data.url;
  if (typeof url !== "string") {
    return null;
  }
  if (url === overviewPath) {
    return overviewPath;
  }
  const [path, query] = url.split("?");
  if (path !== subscriptionPath || query === undefined) {
    return null;
  }
  const raw = query
    .split("&")
    .map((pair) => pair.split("="))
    .find(([key]) => key === "id")?.[1];
  const id = parseSubscriptionId(raw);
  return id === null ? null : { pathname: subscriptionPath, params: { id } };
}
