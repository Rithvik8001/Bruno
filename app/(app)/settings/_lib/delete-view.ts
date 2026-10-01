import type { BlockGroup, DeleteBlock, MoneyAmount } from "@/lib/account/rules";
import { routes } from "@/lib/auth/rules";
import { formatMoney } from "@/lib/currency";
import { cents } from "@/lib/money";
import { settingsCopy } from "../_data";

const ROWS_MAX = 3;
const PAYMENTS_FILTER = "payments";

export interface BlockRow {
  readonly key: string;
  readonly group: BlockGroup;
  readonly amount: string;
  readonly owed: boolean;
}

export interface BlockView {
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
  readonly rows: readonly BlockRow[];
  readonly more: number;
}

const money = ({ amount, currency }: MoneyAmount) => formatMoney(cents(Math.abs(amount)), currency);

function joinAmounts(amounts: readonly MoneyAmount[]): string {
  const parts = amounts.map(money);
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
}

export function blockView(block: DeleteBlock): BlockView {
  const copy = settingsCopy.deleteAccount.blocked;
  const plain = { rows: [], more: 0 } as const;
  switch (block.kind) {
    case "money": {
      const owed = joinAmounts(block.owed);
      const owe = joinAmounts(block.owe);
      const both = block.owed.length > 0 && block.owe.length > 0;
      const rows = block.groups.length > 1 ? block.groups : [];
      return {
        title: both ? copy.money.both(owed, owe) : block.owed.length > 0 ? copy.money.owed(owed) : copy.money.owe(owe),
        body: both ? copy.money.bothBody : block.owed.length > 0 ? copy.money.owedBody : copy.money.oweBody,
        cta: copy.money.cta,
        href: block.settle ? routes.settle(block.settle.groupId, block.settle.personId, routes.settings) : routes.app,
        rows: rows.slice(0, ROWS_MAX).map((group) => ({
          key: `${group.id}:${group.balance.currency}`,
          group,
          amount: `${group.balance.amount > 0 ? "+" : ""}${money(group.balance)}`,
          owed: group.balance.amount > 0,
        })),
        more: Math.max(0, rows.length - ROWS_MAX),
      };
    }
    case "payment":
      return {
        ...plain,
        title: copy.payment.title,
        body: block.direction === "sent" ? copy.payment.sent(block.name, money(block.amount)) : copy.payment.received(block.name, money(block.amount)),
        cta: copy.payment.cta,
        href: `${routes.activity}?filter=${PAYMENTS_FILTER}`,
      };
    case "claiming":
      return { ...plain, title: copy.claiming.title(block.title), body: copy.claiming.body, cta: copy.claiming.cta, href: routes.claimBill(block.code) };
    case "admin":
      return {
        ...plain,
        title: copy.admin.title(block.name),
        body: copy.admin.body,
        cta: copy.admin.cta(block.name),
        href: routes.groupTab(block.groupId, "members"),
      };
  }
}
