import { billFieldWords, claimedList, type ClaimedItem } from "@/lib/bills/messages";
import type { BillChangeField } from "@/lib/bills/diff";
import type { FeedFilter } from "@/lib/feed/types";

const list = (words: readonly string[]) =>
  words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;

export const activityCopy = {
  metaTitle: "Activity",
  title: "Activity",
  filtersLabel: "Filter activity",
  filters: { all: "All", you: "You", payments: "Payments" } as const satisfies Record<FeedFilter, string>,
  empty: {
    title: "Quiet so far",
    body: "Add a bill and every claim, edit and payment shows up here as it happens.",
  },
  earlier: "Show earlier",
  you: "You",
  youLower: "you",
  your: "your",
  someone: "Someone",
  line: {
    billAdded: (title: string) => `added ${title}`,
    billEdited: (fields: readonly BillChangeField[], title: string) =>
      `changed the ${list(fields.map((f) => billFieldWords[f]))} on ${title}`,
    billDeleted: (title: string) => `deleted ${title}`,
    billClaiming: (title: string, reopened: boolean) =>
      reopened ? `reopened claiming on ${title}` : `opened ${title} for claiming`,
    billClaimed: (items: readonly ClaimedItem[], title: string) => `claimed ${claimedList(items)} on ${title}`,
    claimsReminded: (count: number, title: string) =>
      `reminded ${count} ${count === 1 ? "person" : "people"} to claim on ${title}`,
    paid: (to: string) => `paid ${to}`,
    saysPaid: (to: string) => `says they paid ${to}`,
    confirmed: (fromPossessive: string) => `confirmed ${fromPossessive} payment`,
    declined: (fromPossessive: string) => `said they didn’t get ${fromPossessive} payment`,
    cancelled: (to: string) => `cancelled a payment to ${to}`,
    cancelledFrom: (fromPossessive: string) => `cancelled ${fromPossessive} payment`,
    joined: (group: string) => `joined ${group}`,
    started: (group: string) => `started ${group}`,
    added: (name: string, group: string) => `added ${name} to ${group}`,
    addedGuest: (name: string) => `added ${name} as a guest`,
    claimed: "joined Bruno and took over their guest spot",
    linked: (group: string) => `joined ${group} from a bill link`,
    left: (group: string) => `left ${group}`,
    removed: (name: string, group: string) => `removed ${name} from ${group}`,
  },
  possessive: (name: string) => `${name}’s`,
} as const;
