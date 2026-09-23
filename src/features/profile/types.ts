export const reminderLeadOptions = [1, 3, 7] as const;

export type ReminderLeadDays = (typeof reminderLeadOptions)[number];

export function isReminderLeadDays(value: unknown): value is ReminderLeadDays {
  return (
    typeof value === "number" &&
    (reminderLeadOptions as readonly number[]).includes(value)
  );
}

export const notificationFrequencies = ["event", "daily", "twice"] as const;

export type NotificationFrequency = (typeof notificationFrequencies)[number];

export function isNotificationFrequency(
  value: unknown,
): value is NotificationFrequency {
  return (
    typeof value === "string" &&
    (notificationFrequencies as readonly string[]).includes(value)
  );
}

export const defaultSendHour = 9;
export const defaultSecondSendHour = 18;

export function isSendHour(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 23
  );
}

export type Profile = {
  currency: string;
  timeZone: string | null;
  renewalReminders: boolean;
  trialReminders: boolean;
  renewsToday: boolean;
  monthlyDigest: boolean;
  reminderLeadDays: ReminderLeadDays;
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationFrequency: NotificationFrequency;
  sendHour: number;
  secondSendHour: number;
};

export type ProfilePreferences = Omit<Profile, "currency" | "timeZone">;

export type ProfileStatus = "loading" | "ready" | "missing" | "error";
