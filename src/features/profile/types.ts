export const reminderLeadOptions = [1, 3, 7] as const;

export type ReminderLeadDays = (typeof reminderLeadOptions)[number];

export function isReminderLeadDays(value: unknown): value is ReminderLeadDays {
  return (
    typeof value === "number" &&
    (reminderLeadOptions as readonly number[]).includes(value)
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
};

export type ProfilePreferences = Omit<Profile, "currency" | "timeZone">;

export type ProfileStatus = "loading" | "ready" | "error";
