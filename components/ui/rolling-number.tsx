import { cn } from "@/lib/utils/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export interface RollingNumberProps {
  value: string;
  className?: string;
}

export function RollingNumber({ value, className }: RollingNumberProps) {
  const chars = value.split("");
  return (
    <span className={cn("inline-flex", className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((ch, i) => {
          const key = chars.length - i;
          const d = DIGITS.indexOf(ch as (typeof DIGITS)[number]);
          if (d < 0) {
            return (
              <span key={key} className="inline-block">
                {ch}
              </span>
            );
          }
          return (
            <span key={key} className="relative inline-block h-[1lh] overflow-hidden">
              <span
                className="block transition-transform duration-300 ease-standard"
                style={{ transform: `translateY(calc(${d} * -1lh))` }}
              >
                {DIGITS.map((n) => (
                  <span key={n} className="block h-[1lh]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
