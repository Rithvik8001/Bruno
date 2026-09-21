import { isCurrencyCode } from "@/lib/money";
import {
  dataFailure,
  dataSuccess,
  mapDataFailure,
  supabase,
  type DataResult,
} from "@/lib/supabase";

import type { Profile } from "./types";

export async function ensureProfile(
  userId: string,
  currency: string,
): Promise<DataResult<Profile>> {
  try {
    const created = await supabase
      .from("profiles")
      .upsert(
        { id: userId, currency },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (created.error !== null) {
      if (__DEV__) {
        console.log(
          "[bruno profile] create failed",
          created.error.code,
          created.error.message,
        );
      }
      return dataFailure(mapDataFailure(created.error, created.status));
    }

    const { data, error, status } = await supabase
      .from("profiles")
      .select("currency")
      .eq("id", userId)
      .single();

    if (error !== null) {
      if (__DEV__) {
        console.log("[bruno profile] read failed", error.code, error.message);
      }
      return dataFailure(mapDataFailure(error, status));
    }
    if (!isCurrencyCode(data.currency)) {
      return dataFailure("unknown");
    }
    return dataSuccess({ currency: data.currency });
  } catch {
    return dataFailure("network");
  }
}
