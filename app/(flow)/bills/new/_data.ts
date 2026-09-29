export const newBillCopy = {
  metaTitle: "Add a bill",
  entry: {
    back: "Home",
    title: "Add a bill",
    body: "Type it in and Bruno does the maths. Receipt scanning is on its way.",
    forLabel: "For",
    groupsLabel: "Which group is this for?",
    typeItIn: { title: "Type it in", body: "Add items by hand. Unlimited, always." },
    empty: {
      message: "Bills live in a group. Start one, invite the people you split with, then add the bill.",
      cta: "Start a group",
    },
  },
} as const;
