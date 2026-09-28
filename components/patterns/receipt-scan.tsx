import { Icon } from "@/components/icons/icon";
import { Receipt } from "@/components/ui/receipt";
import type { Tint } from "@/lib/design-system/tokens";
import { formatCents, type Cents } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export interface ScanLine {
  readonly id: string;
  readonly name: string;
  readonly price: Cents;
  readonly category: string;
  readonly tint: Tint;
  readonly ghostWidth: `${number}%`;
}

export interface ReceiptScanProps {
  merchant: string;
  lines: readonly ScanLine[];
  total: Cents;
  progress: number | null;
  className?: string;
}

type ScanPhase = "idle" | "edges" | "reading" | "totalling" | "ready";

const lineRevealAt = (i: number) => 18 + i * 14;
const TOTAL_AT = 92;
const HEADER_AT = 8;
const EDGES_UNTIL = 12;

function phaseOf(progress: number | null, found: number, lineCount: number): ScanPhase {
  if (progress === null) return "idle";
  if (progress >= TOTAL_AT) return "ready";
  if (progress < EDGES_UNTIL) return "edges";
  return found === lineCount ? "totalling" : "reading";
}

const chipByPhase = {
  idle: { tint: "muted", label: () => "Idle" },
  edges: { tint: "brand", label: () => "Reading" },
  reading: { tint: "brand", label: (n: number) => (n ? `Found ${n}` : "Reading") },
  totalling: { tint: "brand", label: (n: number) => `Found ${n}` },
  ready: { tint: "green", label: () => "Ready" },
} as const satisfies Record<ScanPhase, { tint: Tint; label: (found: number) => string }>;

export function ReceiptScan({ merchant, lines, total, progress, className }: ReceiptScanProps) {
  const p = progress ?? -1;
  const revealed = lines.map((_, i) => p >= lineRevealAt(i));
  const found = revealed.filter(Boolean).length;
  const phase = phaseOf(progress, found, lines.length);
  const last = found > 0 ? lines[found - 1] : undefined;
  const chip = chipByPhase[phase];
  const totalOn = phase === "ready";
  const beamOn = phase !== "idle" && phase !== "ready";

  const caption = {
    idle: ["Press run to watch it read.", " "],
    edges: ["Finding the edges…", "Straightening the photo."],
    reading: last
      ? [`Spotted ${last.name}`, `${last.category} · ${formatCents(last.price)}`]
      : ["Reading line by line…", "Looking for items and prices."],
    totalling: ["Adding it up…", "Checking tax and tip match."],
    ready: ["Got it all.", `${lines.length} items · adds up to $${formatCents(total)}`],
  }[phase];

  return (
    <div className={cn("w-full max-w-85", className)}>
      <Receipt bodyClassName="relative overflow-hidden pt-3.5">
        <div className="mb-2 flex min-h-7 items-center justify-between">
          <span
            className="font-semibold transition-[filter,opacity] duration-400 ease-standard"
            style={{ filter: `blur(${p >= HEADER_AT ? 0 : 6}px)`, opacity: p >= HEADER_AT ? 1 : 0.2 }}
          >
            {merchant}
          </span>
          <span
            data-tint={chip.tint}
            aria-live="polite"
            className="inline-flex h-6.5 items-center gap-1.5 rounded-[7px] bg-tint-bg pr-2.25 pl-1.75 text-caption text-tint transition-colors duration-220"
          >
            <Icon name="sparkle" size={12} />
            {chip.label(found)}
          </span>
        </div>

        {lines.map((line, i) => {
          const on = revealed[i] === true;
          return (
            <div key={line.id} className="relative flex min-h-10 items-center justify-between gap-4 border-t border-line">
              <span
                aria-hidden
                className="absolute top-1/2 left-0 h-2.5 -translate-y-1/2 rounded-full bg-surface-2 transition-opacity duration-300"
                style={{ width: line.ghostWidth, opacity: on ? 0 : 1 }}
              />
              <span
                aria-hidden
                className="absolute top-1/2 right-0 h-2.5 w-11 -translate-y-1/2 rounded-full bg-surface-2 transition-opacity duration-300"
                style={{ opacity: on ? 0 : 1 }}
              />
              <span
                className="flex min-w-0 items-center gap-2 transition-[filter,opacity,transform] duration-450 ease-standard"
                style={{
                  filter: `blur(${on ? 0 : 6}px)`,
                  opacity: on ? 1 : 0,
                  transform: `translateY(${on ? 0 : 4}px)`,
                }}
              >
                <span className="text-small font-medium whitespace-nowrap">{line.name}</span>
                <span
                  data-tint={line.tint}
                  className="inline-flex h-5 items-center rounded-xs bg-tint-bg px-1.75 text-[11px] font-semibold text-tint transition-transform delay-180 duration-300 ease-spring"
                  style={{ transform: `scale(${on ? 1 : 0})` }}
                >
                  {line.category}
                </span>
              </span>
              <span
                className="text-small font-semibold transition-[filter,opacity] delay-80 duration-450 ease-standard"
                style={{ filter: `blur(${on ? 0 : 6}px)`, opacity: on ? 1 : 0 }}
              >
                {formatCents(line.price)}
              </span>
            </div>
          );
        })}

        <div className="mt-1 flex min-h-11 items-center justify-between border-t border-border">
          <span className="font-semibold transition-opacity duration-400" style={{ opacity: totalOn ? 1 : 0.25 }}>
            Total
          </span>
          <span
            className="text-lead font-semibold transition-[filter,opacity] duration-500 ease-standard"
            style={{ opacity: totalOn ? 1 : 0.25, filter: `blur(${totalOn ? 0 : 5}px)` }}
          >
            ${formatCents(total)}
          </span>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -mt-14 h-16 transition-[top,opacity] ease-linear"
          style={{
            top: `${Math.min(100, 6 + Math.max(0, p) * 0.94)}%`,
            opacity: beamOn ? 1 : 0,
            transitionDuration: "140ms, 300ms",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-brand-tint" />
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
          <Icon name="sparkle" size={14} className="absolute right-3.5 -bottom-1.5 animate-pulse-soft text-brand" />
        </div>
      </Receipt>

      <div className="mt-3 grid min-h-10 justify-items-center gap-0.5 text-center">
        <span className="text-small font-semibold">{caption[0]}</span>
        <span className="text-footnote text-text-2">{caption[1]}</span>
      </div>
    </div>
  );
}
