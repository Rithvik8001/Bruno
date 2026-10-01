import { bucketLabel } from "@/lib/bills/buckets";
import type { AskCard, AskScope } from "./result";

const scopeText = (scope: AskScope) =>
  [
    scope.all ? "all groups" : scope.groups.map((group) => group.name).join(", "),
    scope.bucket ? bucketLabel[scope.bucket] : null,
    scope.from || scope.to ? `${scope.from ?? "start"} to ${scope.to ?? "now"}` : null,
  ]
    .filter(Boolean)
    .join(", ");

export function describeCard(card: AskCard): string {
  switch (card.kind) {
    case "balance":
      return `balance between ${card.subject.displayName} and ${card.other.displayName} (${card.all ? "all groups" : card.lines.map((line) => line.group.name).join(", ")})`;
    case "why":
      return `bill-by-bill explanation of the balance between ${card.subject.displayName} and ${card.other.displayName} in ${card.group.name}`;
    case "spend":
      return `spending of ${card.whose?.displayName ?? "the whole group"} (${scopeText(card.scope)})${card.breakdown ? ` by ${card.breakdown.by}` : ""}`;
    case "rank":
      return `${card.metric} ranked by ${card.by}${card.subject ? ` for ${card.subject.displayName}` : ""} (${scopeText(card.scope)})`;
    case "list":
      return `list of bills (${[scopeText(card.filter), card.filter.payer ? `paid by ${card.filter.payer.displayName}` : null, card.filter.involving ? `involving ${card.filter.involving.displayName}` : null, card.filter.title ? `named ${card.filter.title}` : null].filter(Boolean).join(", ")})`;
    case "activity":
      return `history of ${card.bill ? `the bill ${card.bill.title}` : (card.group?.name ?? "all groups")}`;
    case "empty":
      return `nothing found for ${card.about} (${scopeText(card.scope)})`;
    case "decline":
      return `declined: ${card.reason}`;
  }
}
