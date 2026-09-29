import type { GroupSummary } from "@/lib/groups/queries";
import { groupsCopy } from "../_data";

export function groupMeta(group: Pick<GroupSummary, "memberCount" | "openBills">): string {
  const parts = [groupsCopy.card.people(group.memberCount)];
  if (group.openBills > 0) parts.push(groupsCopy.card.openBills(group.openBills));
  return parts.join(" · ");
}

export function balanceCaption(balance: number): string {
  const { card } = groupsCopy;
  return balance > 0 ? card.owedToYou : balance < 0 ? card.youOwe : card.allSquare;
}
