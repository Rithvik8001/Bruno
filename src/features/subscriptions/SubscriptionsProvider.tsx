import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "@/features/auth";
import { useProfile } from "@/features/profile";
import { dataFailure, type DataFailure, type DataResult } from "@/lib/supabase";

import { createSubscription, listSubscriptions } from "./api";
import type { NewSubscription, Subscription } from "./types";

export type SubscriptionsStatus = "loading" | "ready" | "error";

export type SubscriptionsState = {
  status: SubscriptionsStatus;
  failure: DataFailure | null;
  subscriptions: readonly Subscription[];
  refresh: () => Promise<void>;
  add: (input: NewSubscription) => Promise<DataResult<Subscription>>;
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

  const refresh = async () => {
    if (userId === null) {
      return;
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
