import type { DataFailure } from "@/lib/supabase";

import { subscriptionsCopy } from "./copy";

export function failureMessage(reason: DataFailure): string {
  switch (reason) {
    case "network":
      return subscriptionsCopy.errors.network;
    case "session":
      return subscriptionsCopy.errors.session;
    case "invalid":
      return subscriptionsCopy.errors.invalid;
    case "limitReached":
      return subscriptionsCopy.errors.limitReached;
    case "profileMissing":
    case "unknown":
      return subscriptionsCopy.errors.generic;
  }
}
