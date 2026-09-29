import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { checkTint, type CheckTone } from "../data";
import { BackLink } from "@/components/patterns/back-link";

export interface StepStatus {
  readonly label: string;
  readonly tone: CheckTone;
  readonly pop?: boolean;
}

export interface StepHeaderProps {
  back: { readonly label: string; readonly onBack: () => void };
  status: StepStatus;
  title: ReactNode;
  body: ReactNode;
}

export function StepHeader({ back, status, title, body }: StepHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <BackLink label={back.label} onClick={back.onBack} />
        <Chip
          key={status.pop ? "pop" : "idle"}
          tint={checkTint[status.tone]}
          size="sm"
          dot
          role="status"
          className={status.pop ? "animate-pop-spring" : undefined}
        >
          {status.label}
        </Chip>
      </div>
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{title}</h1>
        <p className="m-0 text-text-2">{body}</p>
      </div>
    </>
  );
}
