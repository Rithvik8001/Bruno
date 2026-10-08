import type { NotificationCategory } from "./kinds";

export interface NotificationCategoryCopy {
  readonly label: string;
  readonly sub: string;
}

export const notificationCategoryCopy = {
  bills: { label: "New bill in a group", sub: "When someone adds a bill you’re on, or splits it." },
  claims: { label: "Claims on my bills", sub: "When friends tap items on your bill, and when everyone’s done." },
  payments: { label: "Payments", sub: "When someone pays you, or marks yours as received." },
  weekly: { label: "Reminders about what I owe", sub: "A nudge when a friend’s waiting on you." },
  monthly: { label: "Monthly recap", sub: "One email on the 1st. Never a push." },
} as const satisfies Record<NotificationCategory, NotificationCategoryCopy>;

export const notificationMessages = {
  linkExpired: "This link has expired. Sign in and change it in Settings instead.",
  lockExpired: "This link has expired. Reset your password from the sign-in page instead.",
} as const;
