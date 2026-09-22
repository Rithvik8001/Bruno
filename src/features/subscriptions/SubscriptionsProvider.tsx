import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "@/features/auth";
import { useProfile } from "@/features/profile";
import {
  dataFailure,
  dataSuccess,
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

  useEffect(() => {
    if (userId === null) {
      setLoaded(null);
      return;
    }

    let active = true;
    listSubscriptions().then((result) => {
      if (!active) {
        return;
      }
      setLoaded(
        result.ok
          ? { userId, subscriptions: result.data, failure: null }
          : { userId, subscriptions: none, failure: result.reason },
      );
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const current = loaded !== null && loaded.userId === userId ? loaded : null;

  const refresh = async (): Promise<DataResult<void>> => {
    if (userId === null) {
      return dataFailure("session");
    }
    const result = await listSubscriptions();
    setLoaded((previous) => {
      if (result.ok) {
        return { userId, subscriptions: result.data, failure: null };
      }
      if (previous !== null && previous.userId === userId) {
        return { ...previous, failure: result.reason };
      }
      return { userId, subscriptions: none, failure: result.reason };
    });
    return result.ok ? dataSuccess(undefined) : result;
  };

  const add = async (
    input: NewSubscription,
  ): Promise<DataResult<Subscription>> => {
    if (userId === null) {
      return dataFailure("session");
    }
    if (profile === null) {
      return dataFailure("profileMissing");
    }

    const result = await createSubscription(input, profile.currency);
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
