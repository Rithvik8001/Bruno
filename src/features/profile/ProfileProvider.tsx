import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "@/features/auth";
import {
  dataFailure,
  dataSuccess,
  type DataFailure,
  type DataResult,
} from "@/lib/supabase";

import {
  changeCurrency as changeProfileCurrency,
  createProfile,
  loadProfile,
  updatePreferences,
} from "./api";
import { getDeviceTimeZone } from "./deviceTimeZone";
import type { Profile, ProfilePreferences, ProfileStatus } from "./types";

export type ProfileState = {
  profile: Profile | null;
  status: ProfileStatus;
  failure: DataFailure | null;
  retry: () => void;
  update: (patch: Partial<ProfilePreferences>) => Promise<DataResult<null>>;
  create: (currency: string) => Promise<DataResult<null>>;
  changeCurrency: (currency: string) => Promise<DataResult<null>>;
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
    loadProfile(userId, getDeviceTimeZone()).then((result) => {
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

  const update = async (
    patch: Partial<ProfilePreferences>,
  ): Promise<DataResult<null>> => {
    if (userId === null || current === null || current.profile === null) {
      return dataFailure("session");
    }
    const previous = current.profile;
    setLoaded({ ...current, profile: { ...previous, ...patch } });
    const result = await updatePreferences(userId, patch);
    if (!result.ok) {
      setLoaded((latest) =>
        latest !== null && latest.userId === userId
          ? { ...latest, profile: previous }
          : latest,
      );
    }
    return result;
  };

  const create = async (currency: string): Promise<DataResult<null>> => {
    if (userId === null) {
      return dataFailure("session");
    }
    const result = await createProfile(userId, currency, getDeviceTimeZone());
    if (!result.ok) {
      return dataFailure(result.reason);
    }
    setLoaded({ userId, profile: result.data, failure: null });
    return dataSuccess(null);
  };

  const changeCurrency = async (
    currency: string,
  ): Promise<DataResult<null>> => {
    if (userId === null || current === null || current.profile === null) {
      return dataFailure("session");
    }
    const result = await changeProfileCurrency(currency);
    if (result.ok) {
      setLoaded((latest) =>
        latest !== null && latest.userId === userId && latest.profile !== null
          ? { ...latest, profile: { ...latest.profile, currency } }
          : latest,
      );
    }
    return result;
  };

  const state: ProfileState = {
    profile: current?.profile ?? null,
    status:
      current === null
        ? "loading"
        : current.failure !== null
          ? "error"
          : current.profile === null
            ? "missing"
            : "ready",
    failure: current?.failure ?? null,
    retry: () => {
      setLoaded(null);
      setAttempt((value) => value + 1);
    },
    update,
    create,
    changeCurrency,
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
