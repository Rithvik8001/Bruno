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

export async function getPushToken(): Promise<string | null> {
  const projectId: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== "string") {
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
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
