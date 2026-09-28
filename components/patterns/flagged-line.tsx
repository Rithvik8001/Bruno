import { Icon } from "@/components/icons/icon";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface FlaggedLineProps {
  name: string;
  guesses: readonly Cents[];
  value: Cents | null;
  onResolve: (value: Cents) => void;
  prompt?: string;
}

export function FlaggedLine({
  name,
  guesses,
  value,
  onResolve,
  prompt = "Hard to read — was it",
}: FlaggedLineProps) {
  const open = value === null;

  return (
    <div
      data-tint="amber"
      className={cn(
        "-mx-2.5 my-1.5 grid gap-2 rounded-[12px] p-2.5 transition-[background-color] duration-220 ease-standard",
        open ? "bg-tint-bg" : "bg-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{name}</span>
        <span
          className={cn(
            "inline-flex h-9 min-w-18 items-center justify-end rounded-sm border px-2.5 font-semibold transition-[background-color,border-color] duration-220 ease-standard",
            open ? "border-tint bg-bg" : "border-transparent bg-transparent",
          )}
        >
          {value === null ? "—" : formatCents(value)}
        </span>
      </div>
      {open && (
        <div role="group" aria-label={`${prompt}…`} className="flex flex-wrap items-center gap-2 text-footnote font-semibold text-tint">
          <Icon name="alert" size={14} strokeWidth={2.2} />
          {prompt}
          {guesses.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onResolve(g)}
              className="h-7 cursor-pointer rounded-[7px] bg-bg px-2.5 text-footnote font-semibold text-text shadow-float"
            >
              {formatCents(g)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
