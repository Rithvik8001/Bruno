import type { Session } from "@supabase/supabase-js";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { readStoredSession, supabase } from "@/lib/supabase";

export type SessionState = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    readStoredSession().then((stored) => {
      if (active) {
        setState((current) =>
          current.loading ? { session: stored, loading: false } : current,
        );
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setState((current) => ({
            session: error === null ? data.session : current.session,
            loading: false,
          }));
        }
      })
      .catch(() => {
        if (active) {
          setState((current) => ({ ...current, loading: false }));
        }
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") {
        setState({ session, loading: false });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}

export function useSession(): SessionState {
  const state = use(SessionContext);
  if (state === null) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return state;
}
