import {
  dataFailure,
  dataSuccess,
  mapDataFailure,
  supabase,
  type DataResult,
} from "@/lib/supabase";

import {
  fromRow,
  fromRows,
  subscriptionColumns,
  toInsert,
  toUpdate,
} from "./mapping";
import type { NewSubscription, Subscription } from "./types";

export async function listSubscriptions(): Promise<DataResult<Subscription[]>> {
  try {
    const { data, error, status } = await supabase
      .from("subscriptions")
      .select(subscriptionColumns)
      .order("created_at", { ascending: true });

    if (error !== null) {
      if (__DEV__) {
        console.log("[bruno subscriptions] list failed", error.code, error.message);
      }
      return dataFailure(mapDataFailure(error, status));
    }
    return dataSuccess(fromRows(data));
  } catch {
    return dataFailure("network");
  }
}

export async function createSubscription(
  input: NewSubscription,
  currency: string,
): Promise<DataResult<Subscription>> {
  try {
    const { data, error, status } = await supabase
      .from("subscriptions")
      .insert(toInsert(input, currency))
      .select(subscriptionColumns)
      .single();

    if (error !== null) {
      if (__DEV__) {
        console.log(
          "[bruno subscriptions] create failed",
          error.code,
          error.message,
        );
      }
      return dataFailure(mapDataFailure(error, status));
    }

    const subscription = fromRow(data);
    return subscription === null
      ? dataFailure("unknown")
      : dataSuccess(subscription);
  } catch {
    return dataFailure("network");
  }
}

export async function updateSubscription(
  id: string,
  input: NewSubscription,
): Promise<DataResult<Subscription>> {
  try {
    const { data, error, status } = await supabase
      .from("subscriptions")
      .update(toUpdate(input))
      .eq("id", id)
      .select(subscriptionColumns)
      .single();

    if (error !== null) {
      if (__DEV__) {
        console.log(
          "[bruno subscriptions] update failed",
          error.code,
          error.message,
        );
      }
      return dataFailure(mapDataFailure(error, status));
    }

    const subscription = fromRow(data);
    return subscription === null
      ? dataFailure("unknown")
      : dataSuccess(subscription);
  } catch {
    return dataFailure("network");
  }
}

export async function deleteSubscription(
  id: string,
): Promise<DataResult<void>> {
  try {
    const { error, status } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error !== null) {
      if (__DEV__) {
        console.log(
          "[bruno subscriptions] delete failed",
          error.code,
          error.message,
        );
      }
      return dataFailure(mapDataFailure(error, status));
    }
    return dataSuccess(undefined);
  } catch {
    return dataFailure("network");
  }
}
