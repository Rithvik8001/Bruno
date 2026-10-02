import { Icon } from "@/components/icons/icon";
import { settleCopy } from "../_data";

export function CashPaymentLine() {
  return (
    <div className="flex items-center gap-3 rounded-tile bg-bg px-3.5 py-3">
      <span data-tint="green" className="grid size-8 shrink-0 place-items-center rounded-control bg-tint-bg text-tint">
        <Icon name="wallet" size={16} />
      </span>
      <span className="min-w-0 flex-1 text-small font-semibold">{settleCopy.cashPayment}</span>
    </div>
  );
}
