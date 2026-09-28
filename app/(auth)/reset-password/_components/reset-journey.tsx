import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";
import { RESET_STAGES, resetCopy, resetStageAppearance } from "../_data";

export interface ResetJourneyProps {
  position: number;
}

function Connector({ reached }: { reached: boolean }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[0, 60, 120].map((delay) => (
        <span
          key={delay}
          style={{ transitionDelay: `${delay}ms` }}
          className={cn("size-1 rounded-full transition-colors duration-300", reached ? "bg-green" : "bg-border")}
        />
      ))}
    </span>
  );
}

export function ResetJourney({ position }: ResetJourneyProps) {
  const total = RESET_STAGES.length;
  const label = position < total ? resetCopy.journey.step(position + 1, total) : resetCopy.journey.finished;

  return (
    <div role="img" aria-label={label} className="flex h-18 items-center gap-1.5">
      {RESET_STAGES.map((stage, i) => {
        const done = i < position;
        const current = i === position;
        const { icon, tint } = resetStageAppearance[stage];
        return (
          <div key={stage} className="flex items-center gap-1.5">
            {i > 0 && <Connector reached={i <= position} />}
            <span
              data-tint={done ? "green" : current ? tint : undefined}
              className={cn(
                "relative grid place-items-center transition-[width,height,border-radius,background-color,color] duration-[380ms] ease-spring",
                current ? "size-16 rounded-[20px]" : "size-9 rounded-tile",
                done || current ? "bg-tint-bg text-tint" : "bg-surface text-muted",
              )}
            >
              <span className={cn("grid place-items-center", current && "animate-bob")}>
                {done ? (
                  <Icon key="done" name="check" size={16} strokeWidth={2.6} className="animate-check-in" />
                ) : (
                  <Icon name={icon} size={current ? 28 : 16} />
                )}
              </span>
              {current && (
                <>
                  <Icon name="sparkle" size={10} className="absolute -top-1.5 -right-1.5 animate-twinkle" />
                  <Icon
                    name="sparkle"
                    size={7}
                    className="absolute -bottom-0.5 -left-2 animate-twinkle [animation-delay:0.9s]"
                  />
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
