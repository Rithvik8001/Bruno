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
import {
  dataFailure,
  dataSuccess,
  staleAfterMs,
  withRetry,
  type DataFailure,
  type DataResult,
} from "@/lib/supabase";

import {
  createSubscription,
  deleteSubscription,
  listSubscriptions,
  updateSubscription,
  updateSubscriptionStatus,
} from "./api";
import type {
  NewSubscription,
  Subscription,
  SubscriptionStatus,
} from "./types";

export type SubscriptionsStatus = "loading" | "ready" | "error";

export type SubscriptionsState = {
  status: SubscriptionsStatus;
  failure: DataFailure | null;
  subscriptions: readonly Subscription[];
  refresh: () => Promise<DataResult<void>>;
  add: (input: NewSubscription) => Promise<DataResult<Subscription>>;
  update: (
    id: string,
    input: NewSubscription,
  ) => Promise<DataResult<Subscription>>;
  setStatus: (
    id: string,
    status: SubscriptionStatus,
  ) => Promise<DataResult<Subscription>>;
  remove: (id: string) => Promise<DataResult<void>>;
};

type Loaded = {
  userId: string;
  subscriptions: readonly Subscription[];
  failure: DataFailure | null;
};

const SubscriptionsContext = createContext<SubscriptionsState | null>(null);

const none: readonly Subscription[] = [];

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { profile } = useProfile();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const lastSuccess = useRef<number | null>(null);
  const failed = useRef(false);
  const currency = useRef<string | null>(null);

  useEffect(() => {
    currency.current = profile?.currency ?? null;
  }, [profile]);

  const load = async (
    owner: string,
    retry: boolean,
  ): Promise<DataResult<void>> => {
    sequence.current += 1;
    const mine = sequence.current;
    inFlight.current = true;
    const result = await (retry
      ? withRetry(listSubscriptions)
      : listSubscriptions());
    if (mine !== sequence.current) {
      return result.ok ? dataSuccess(undefined) : result;
    }
    inFlight.current = false;
    failed.current = !result.ok;
    if (result.ok) {
      lastSuccess.current = Date.now();
    }
    setLoaded((previous) => {
      if (result.ok) {
        return { userId: owner, subscriptions: result.data, failure: null };
      }
      if (previous !== null && previous.userId === owner) {
        return { ...previous, failure: result.reason };
      }
      return { userId: owner, subscriptions: none, failure: result.reason };
    });
    return result.ok ? dataSuccess(undefined) : result;
  };

  useEffect(() => {
    lastSuccess.current = null;
    failed.current = false;
    if (userId === null) {
      sequence.current += 1;
      inFlight.current = false;
      setLoaded(null);
      return;
    }
    void load(userId, true);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || inFlight.current) {
        return;
      }
      const stale =
        lastSuccess.current === null ||
        Date.now() - lastSuccess.current >= staleAfterMs;
      if (stale || failed.current) {
        void load(userId, true);
      }
    });
    return () => {
      sequence.current += 1;
      inFlight.current = false;
      subscription.remove();
    };
  }, [userId]);

  const current = loaded !== null && loaded.userId === userId ? loaded : null;

  const refresh = async (): Promise<DataResult<void>> => {
    if (userId === null) {
      return dataFailure("session");
    }
    return load(userId, false);
  };

  const add = async (
    input: NewSubscription,
  ): Promise<DataResult<Subscription>> => {
    if (userId === null) {
      return dataFailure("session");
    }
    if (currency.current === null) {
      return dataFailure("profileMissing");
    }

    const result = await createSubscription(input, currency.current);
    if (result.ok) {
      setLoaded((previous) =>
        previous !== null && previous.userId === userId
          ? {
              userId,
              subscriptions: [...previous.subscriptions, result.data],
              failure: null,
            }
          : { userId, subscriptions: [result.data], failure: null },
      );
    }
    return result;
  };

  const replace = (
    userId: string,
    id: string,
    subscription: Subscription,
  ) => {
    setLoaded((previous) => {
      if (previous === null || previous.userId !== userId) {
        return { userId, subscriptions: [subscription], failure: null };
      }
      const exists = previous.subscriptions.some((item) => item.id === id);
      return {
        userId,
        subscriptions: exists
          ? previous.subscriptions.map((item) =>
              item.id === id ? subscription : item,
            )
          : [...previous.subscriptions, subscription],
        failure: null,
      };
    });
  };

  const update = async (
    id: string,
    input: NewSubscription,
  ): Promise<DataResult<Subscription>> => {
    if (userId === null) {
      return dataFailure("session");
    }

    const result = await updateSubscription(id, input);
    if (result.ok) {
      replace(userId, id, result.data);
    }
    return result;
  };

  const setStatus = async (
    id: string,
    status: SubscriptionStatus,
  ): Promise<DataResult<Subscription>> => {
    if (userId === null) {
      return dataFailure("session");
    }

    const result = await updateSubscriptionStatus(id, status);
    if (result.ok) {
      replace(userId, id, result.data);
    }
    return result;
  };

  const remove = async (id: string): Promise<DataResult<void>> => {
    if (userId === null) {
      return dataFailure("session");
    }

    const result = await deleteSubscription(id);
    if (result.ok) {
      setLoaded((previous) =>
        previous !== null && previous.userId === userId
          ? {
              userId,
              subscriptions: previous.subscriptions.filter(
                (item) => item.id !== id,
              ),
              failure: null,
            }
          : previous,
      );
    }
    return result;
  };

  const state: SubscriptionsState = {
    status:
      current === null
        ? "loading"
        : current.failure !== null && current.subscriptions.length === 0
          ? "error"
          : "ready",
    failure: current?.failure ?? null,
    subscriptions: current?.subscriptions ?? none,
    refresh,
    add,
    update,
    setStatus,
    remove,
  };

  return <SubscriptionsContext value={state}>{children}</SubscriptionsContext>;
}

export function useSubscriptions(): SubscriptionsState {
  const state = use(SubscriptionsContext);
  if (state === null) {
    throw new Error("useSubscriptions must be used inside SubscriptionsProvider");
  }
  return state;
}
