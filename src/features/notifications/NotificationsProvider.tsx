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
  registered: boolean;
  registering: boolean;
  registrationError: string | null;
  requestPermission: () => Promise<PushPermission>;
  retryRegistration: () => void;
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
  const [registered, setRegistered] = useState(() => readStoredPushToken() !== null);
  const [registering, setRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [pending, setPending] = useState<Href | null>(null);
  const handled = useRef<string | null>(null);
  const inFlight = useRef(false);
  const failed = useRef(false);
  const deviceToken = useRef<string | null>(null);
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const read = () => {
      getPushPermission().then((next) => {
        if (!active) {
          return;
        }
        setPermission((previous) =>
          previous !== null &&
          previous.status === next.status &&
          previous.canAskAgain === next.canAskAgain
            ? previous
            : next,
        );
        if (failed.current && !inFlight.current) {
          setRefresh((value) => value + 1);
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
      setRegistering(true);
      inFlight.current = true;
      getPushToken().then(async (fetched) => {
        if (!active) {
          return;
        }
        if (!fetched.ok) {
          inFlight.current = false;
          failed.current = true;
          setRegistered(false);
          setRegistering(false);
          setRegistrationError(fetched.reason);
          return;
        }
        deviceToken.current = fetched.deviceToken;
        if (
          registeredToken.current === fetched.token &&
          readStoredPushToken() === fetched.token
        ) {
          inFlight.current = false;
          failed.current = false;
          setRegistered(true);
          setRegistering(false);
          setRegistrationError(null);
          return;
        }
        const result = await registerPushToken(fetched.token);
        if (!active) {
          return;
        }
        inFlight.current = false;
        failed.current = !result.ok;
        if (result.ok) {
          registeredToken.current = fetched.token;
          writeStoredPushToken(fetched.token);
        }
        setRegistered(result.ok);
        setRegistering(false);
        setRegistrationError(result.ok ? null : result.reason);
      });
      return () => {
        active = false;
        inFlight.current = false;
      };
    }
    setRegistering(false);
    failed.current = false;
    const stored = readStoredPushToken();
    if (permission.status === "denied" && stored !== null) {
      writeStoredPushToken(null);
      registeredToken.current = null;
      setRegistered(false);
      void unregisterPushToken(stored);
    }
    return () => {
      active = false;
    };
  }, [userId, permission, refresh]);

  useEffect(() => {
    const subscription = Notifications.addPushTokenListener((token) => {
      if (inFlight.current || token.data === deviceToken.current) {
        return;
      }
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
    registeredToken.current = null;
    setRegistered(false);
  };

  const retryRegistration = () => {
    setRefresh((value) => value + 1);
  };

  return (
    <PushContext
      value={{
        permission,
        registered,
        registering,
        registrationError,
        requestPermission,
        retryRegistration,
        releaseDevice,
      }}
    >
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
