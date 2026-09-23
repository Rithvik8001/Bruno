import { isCurrencyCode } from "@/lib/money";
import {
  dataFailure,
  dataSuccess,
  mapDataFailure,
  supabase,
  type DataResult,
} from "@/lib/supabase";

import {
  defaultSecondSendHour,
  defaultSendHour,
  isNotificationFrequency,
  isReminderLeadDays,
  isSendHour,
  type Profile,
  type ProfilePreferences,
} from "./types";

const profileColumns =
  "currency, timezone, renewal_reminders, trial_reminders, renews_today, monthly_digest, reminder_lead_days, push_enabled, email_enabled, notification_frequency, send_hour, second_send_hour";

const defaultLeadDays = 3;

type ProfileRow = {
  currency: string;
  timezone: string | null;
  renewal_reminders: boolean;
  trial_reminders: boolean;
  renews_today: boolean;
  monthly_digest: boolean;
  reminder_lead_days: number;
  push_enabled: boolean;
  email_enabled: boolean;
  notification_frequency: string;
  send_hour: number;
  second_send_hour: number;
};

function toProfile(row: ProfileRow, timeZone: string | null): Profile | null {
  if (!isCurrencyCode(row.currency)) {
    return null;
  }
  return {
    currency: row.currency,
    timeZone: row.timezone ?? timeZone,
    renewalReminders: row.renewal_reminders,
    trialReminders: row.trial_reminders,
    renewsToday: row.renews_today,
    monthlyDigest: row.monthly_digest,
    reminderLeadDays: isReminderLeadDays(row.reminder_lead_days)
      ? row.reminder_lead_days
      : defaultLeadDays,
    pushEnabled: row.push_enabled,
    emailEnabled: row.email_enabled,
    notificationFrequency: isNotificationFrequency(row.notification_frequency)
      ? row.notification_frequency
      : "event",
    sendHour: isSendHour(row.send_hour) ? row.send_hour : defaultSendHour,
    secondSendHour: isSendHour(row.second_send_hour)
      ? row.second_send_hour
      : defaultSecondSendHour,
  };
}

export async function loadProfile(
  userId: string,
  timeZone: string | null,
): Promise<DataResult<Profile | null>> {
  try {
    const { data, error, status } = await supabase
      .from("profiles")
      .select(profileColumns)
      .eq("id", userId)
      .maybeSingle();

    if (error !== null) {
      if (__DEV__) {
        console.log("[bruno profile] read failed", error.code, error.message);
      }
      return dataFailure(mapDataFailure(error, status));
    }
    if (data === null) {
      return dataSuccess(null);
    }

    const profile = toProfile(data, timeZone);
    if (profile === null) {
      return dataFailure("unknown");
    }
    if (timeZone !== null && data.timezone !== timeZone) {
      void supabase.from("profiles").update({ timezone: timeZone }).eq("id", userId);
    }
    return dataSuccess(profile);
  } catch {
    return dataFailure("network");
  }
}

export async function createProfile(
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

    const loaded = await loadProfile(userId, timeZone);
    if (!loaded.ok) {
      return loaded;
    }
    return loaded.data === null ? dataFailure("unknown") : dataSuccess(loaded.data);
  } catch {
    return dataFailure("network");
  }
}

export async function changeCurrency(
  currency: string,
): Promise<DataResult<null>> {
  try {
    const { error, status } = await supabase.rpc("change_currency", {
      p_currency: currency,
    });

    if (error !== null) {
      if (__DEV__) {
        console.log(
          "[bruno profile] currency change failed",
          error.code,
          error.message,
        );
      }
      return dataFailure(mapDataFailure(error, status));
    }
    return dataSuccess(null);
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
        push_enabled: patch.pushEnabled,
        email_enabled: patch.emailEnabled,
        notification_frequency: patch.notificationFrequency,
        send_hour: patch.sendHour,
        second_send_hour: patch.secondSendHour,
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
