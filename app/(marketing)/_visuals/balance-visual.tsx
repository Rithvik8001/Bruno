import { Avatar } from "@/components/ui/avatar";
import { AmountChip } from "@/components/ui/chip";
import { formatCents } from "@/lib/money";
import { balancePeople, balanceTotal } from "../_data";
import { SurfaceCard } from "../_components/primitives";

export function BalanceVisual() {
  return (
    <SurfaceCard className="px-5 pt-6 pb-2">
      <div className="text-small font-medium text-text-2">Overall</div>
      <div className="mt-0.5 mb-4.5 text-[2.5rem] leading-11.5 font-semibold tracking-tight">
        You&apos;re owed{" "}
        <span className="text-green">${formatCents(balanceTotal)}</span>
      </div>
      {balancePeople.map(({ person, caption, amount, direction }) => (
        <div
          key={person.id}
          className="grid min-h-15 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-line"
        >
          <Avatar
            name={person.name}
            initials={person.initials}
            tint={person.tint}
            size="lg"
          />
          <span className="grid min-w-0">
            <span className="truncate font-medium">{person.name}</span>
            <span className="text-footnote text-text-2">{caption}</span>
          </span>
          <AmountChip amount={amount} direction={direction} />
        </div>
      ))}
    </SurfaceCard>
  );
}
