import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { useSession } from "@/features/auth";
import { useProfile } from "@/features/profile";

import { registerPushToken, unregisterPushToken } from "./api";
import {
  getPushPermission,
  getPushToken,
  parseNotificationUrl,
  requestPushPermission,
} from "./push";
import { readStoredPushToken, writeStoredPushToken } from "./pushStorage";
import type { PushPermission } from "./types";

export type PushStatus = {
  permission: PushPermission | null;
  requestPermission: () => Promise<PushPermission>;
  releaseDevice: () => Promise<void>;
};

const releaseTimeoutMs = 3000;

const PushContext = createContext<PushStatus | null>(null);

function withTimeout(task: Promise<unknown>, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    task.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      () => {
        clearTimeout(timer);
        resolve();
      },
    );
  });
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { status: profileStatus } = useProfile();
  const userId = session?.user.id ?? null;
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [pending, setPending] = useState<Href | null>(null);
  const handled = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const read = () => {
      getPushPermission().then((next) => {
        if (active) {
          setPermission(next);
        }
      });
    };
    read();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        read();
      }
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (userId === null || permission === null) {
      return;
    }
    let active = true;
    if (permission.status === "granted") {
      getPushToken().then(async (token) => {
        if (!active || token === null) {
          return;
        }
        const result = await registerPushToken(token);
        if (active && result.ok) {
          writeStoredPushToken(token);
        }
      });
      return () => {
        active = false;
      };
    }
    const stored = readStoredPushToken();
    if (permission.status === "denied" && stored !== null) {
      writeStoredPushToken(null);
      void unregisterPushToken(stored);
    }
    return () => {
      active = false;
    };
  }, [userId, permission, refresh]);

  useEffect(() => {
    const subscription = Notifications.addPushTokenListener(() => {
      setRefresh((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse | null) => {
      if (response === null) {
        return;
      }
      const id = response.notification.request.identifier;
      if (handled.current === id) {
        return;
      }
      handled.current = id;
      setPending(parseNotificationUrl(response.notification.request.content.data));
    };
    handle(Notifications.getLastNotificationResponse());
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (pending === null || userId === null || profileStatus !== "ready") {
      return;
    }
    setPending(null);
    Notifications.clearLastNotificationResponse();
    router.push(pending);
  }, [pending, userId, profileStatus]);

  const requestPermission = async (): Promise<PushPermission> => {
    const next = await requestPushPermission();
    setPermission(next);
    return next;
  };

  const releaseDevice = async (): Promise<void> => {
    const stored = readStoredPushToken();
    if (stored === null) {
      return;
    }
    await withTimeout(unregisterPushToken(stored), releaseTimeoutMs);
    writeStoredPushToken(null);
  };

  return (
    <PushContext value={{ permission, requestPermission, releaseDevice }}>
      {children}
    </PushContext>
  );
}

export function usePushStatus(): PushStatus {
  const state = use(PushContext);
  if (state === null) {
    throw new Error("usePushStatus must be used inside NotificationsProvider");
  }
  return state;
}
