import type { ComingSoonContent } from "../_data";

export const groupsCopy = {
  metaTitle: "Groups",
  comingSoon: {
    title: "Groups",
    body: "Groups for trips, flats and teams are coming next. They'll keep a running tab so nobody keeps score.",
    moment: "people",
    tint: "indigo",
  },
} as const satisfies { metaTitle: string; comingSoon: ComingSoonContent };
