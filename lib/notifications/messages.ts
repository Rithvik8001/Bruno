import type { NotificationCategory } from "./kinds";

export interface NotificationCategoryCopy {
  readonly label: string;
  readonly sub: string;
}

export const notificationCategoryCopy = {
  bills: { label: "New bill in a group", sub: "When someone adds a bill you’re part of, or asks you to claim." },
  claims: { label: "Claims on my bills", sub: "One email when everyone has claimed on your bill." },
  payments: { label: "Payments", sub: "When someone pays you or confirms yours." },
  weekly: { label: "Reminders about what I owe", sub: "A Sunday summary, and reminders friends send you." },
  monthly: { label: "Monthly recap", sub: "Your share and where it went, on the 1st." },
} as const satisfies Record<NotificationCategory, NotificationCategoryCopy>;

export const notificationMessages = {
  linkExpired: "This link has expired. Sign in and change it in Settings instead.",
  lockExpired: "This link has expired. Reset your password from the sign-in page instead.",
} as const;
