"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";

export type UsernameAvailability =
  | { readonly status: "idle" }
  | { readonly status: "checking"; readonly username: string }
  | { readonly status: "available"; readonly username: string }
  | { readonly status: "taken"; readonly username: string };

const DEBOUNCE_MS = 400;

export function useUsernameAvailability(raw: string): UsernameAvailability {
  const username = normalizeUsername(raw);
  const checkable = isValidUsername(username);
  const [result, setResult] = useState<UsernameAvailability>({ status: "idle" });

  useEffect(() => {
    if (!checkable) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setResult({ status: "checking", username });
      const { data, error } = await authClient.isUsernameAvailable({ username });
      if (cancelled) return;
      if (error || !data) setResult({ status: "idle" });
      else setResult({ status: data.available ? "available" : "taken", username });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, checkable]);

  if (!checkable) return { status: "idle" };
  if (result.status !== "idle" && result.username !== username) return { status: "checking", username };
  return result;
}
