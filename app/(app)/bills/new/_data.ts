import type { ComingSoonContent } from "../../_data";

export const newBillCopy = {
  metaTitle: "Add a bill",
  comingSoon: {
    title: "Add a bill",
    body: "Scanning receipts and typing bills in are on their way. Bruno will do the maths.",
    moment: "receipt",
    tint: "violet",
  },
} as const satisfies { metaTitle: string; comingSoon: ComingSoonContent };
