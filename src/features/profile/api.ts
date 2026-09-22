import { isCurrencyCode } from "@/lib/money";
import {
  dataFailure,
  dataSuccess,
  mapDataFailure,
  supabase,
  type DataResult,
} from "@/lib/supabase";

import {
  isReminderLeadDays,
  type Profile,
  type ProfilePreferences,
} from "./types";

const profileColumns =
  "currency, timezone, renewal_reminders, trial_reminders, renews_today, monthly_digest, reminder_lead_days";

const defaultLeadDays = 3;

export async function ensureProfile(
  userId: string,
  currency: string,
  timeZone: string | null,
): Promise<DataResult<Profile>> {
  try {
    const created = await supabase
      .from("profiles")
      .upsert(
        { id: userId, currency, timezone: timeZone },
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
      .select(profileColumns)
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

    if (data.timezone === null && timeZone !== null) {
      void supabase.from("profiles").update({ timezone: timeZone }).eq("id", userId);
    }

    return dataSuccess({
      currency: data.currency,
      timeZone: data.timezone ?? timeZone,
      renewalReminders: data.renewal_reminders,
      trialReminders: data.trial_reminders,
      renewsToday: data.renews_today,
      monthlyDigest: data.monthly_digest,
      reminderLeadDays: isReminderLeadDays(data.reminder_lead_days)
        ? data.reminder_lead_days
        : defaultLeadDays,
    });
  } catch {
    return dataFailure("network");
  }
}

export async function updatePreferences(
  userId: string,
  patch: Partial<ProfilePreferences>,
): Promise<DataResult<null>> {
  try {
    const { error, status } = await supabase
      .from("profiles")
      .update({
        renewal_reminders: patch.renewalReminders,
        trial_reminders: patch.trialReminders,
        renews_today: patch.renewsToday,
        monthly_digest: patch.monthlyDigest,
        reminder_lead_days: patch.reminderLeadDays,
      })
      .eq("id", userId);

    if (error !== null) {
      if (__DEV__) {
        console.log("[bruno profile] update failed", error.code, error.message);
      }
      return dataFailure(mapDataFailure(error, status));
    }
    return dataSuccess(null);
  } catch {
    return dataFailure("network");
  }
}
