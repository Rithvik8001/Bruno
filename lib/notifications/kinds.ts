export const NOTIFICATION_CATEGORIES = ["bills", "claims", "payments", "weekly", "monthly"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationPrefs = Readonly<Record<NotificationCategory, boolean>>;

export const categoryColumn = {
  bills: "notifyBills",
  claims: "notifyClaims",
  payments: "notifyPayments",
  weekly: "notifyWeekly",
  monthly: "notifyMonthly",
} as const satisfies Record<NotificationCategory, string>;

export const NOTIFICATION_KINDS = {
  newSignIn: null,
  welcome: null,
  addedToGroup: null,
  claimInvite: "bills",
  billAdded: "bills",
  claimReminder: "bills",
  claimsComplete: "claims",
  paymentReceived: "payments",
  paymentUpdate: "payments",
  weeklyNudge: "weekly",
  debtReminder: "weekly",
  monthlyRecap: "monthly",
} as const satisfies Record<string, NotificationCategory | null>;

export const DEBT_REMINDER_GAP_MS = 3 * 24 * 60 * 60 * 1000;

export type NotificationKind = keyof typeof NOTIFICATION_KINDS;

export function isNotificationCategory(value: unknown): value is NotificationCategory {
  return typeof value === "string" && (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}
