import type { ComingSoonContent } from "../_data";

export const activityCopy = {
  metaTitle: "Activity",
  comingSoon: {
    title: "Activity",
    body: "Claims, payments and reminders will show up here as they happen.",
    moment: "hourglass",
    tint: "cyan",
  },
} as const satisfies { metaTitle: string; comingSoon: ComingSoonContent };
