import type { Session } from "@supabase/supabase-js";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/lib/supabase";

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

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setState({ session: data.session, loading: false });
        }
      })
      .catch(() => {
        if (active) {
          setState({ session: null, loading: false });
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
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
