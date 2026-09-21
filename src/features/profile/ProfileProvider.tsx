import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "@/features/auth";
import type { DataFailure } from "@/lib/supabase";

import { ensureProfile } from "./api";
import { getDeviceCurrency } from "./deviceCurrency";
import type { Profile, ProfileStatus } from "./types";

export type ProfileState = {
  profile: Profile | null;
  status: ProfileStatus;
  failure: DataFailure | null;
  retry: () => void;
};

type Loaded = {
  userId: string;
  profile: Profile | null;
  failure: DataFailure | null;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (userId === null) {
      setLoaded(null);
      return;
    }

    let active = true;
    ensureProfile(userId, getDeviceCurrency()).then((result) => {
      if (!active) {
        return;
      }
      setLoaded(
        result.ok
          ? { userId, profile: result.data, failure: null }
          : { userId, profile: null, failure: result.reason },
      );
    });

    return () => {
      active = false;
    };
  }, [userId, attempt]);

  const current = loaded !== null && loaded.userId === userId ? loaded : null;

  const state: ProfileState = {
    profile: current?.profile ?? null,
    status:
      current === null
        ? "loading"
        : current.profile === null
          ? "error"
          : "ready",
    failure: current?.failure ?? null,
    retry: () => {
      setLoaded(null);
      setAttempt((value) => value + 1);
    },
  };

  return <ProfileContext value={state}>{children}</ProfileContext>;
}

export function useProfile(): ProfileState {
  const state = use(ProfileContext);
  if (state === null) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return state;
}
