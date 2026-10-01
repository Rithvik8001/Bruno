"use client";

import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { BackLink } from "@/components/patterns/back-link";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { checkTint, type CheckTone } from "../data";

export interface StepStatus {
  readonly label: string;
  readonly tone: CheckTone;
}

export interface StepHeaderProps {
  back: { readonly label: string; readonly onBack: () => void };
  status: StepStatus;
  title: ReactNode;
  body: ReactNode;
  banner?: ReactNode;
}

export function StepHeader({ back, status, title, body, banner }: StepHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <BackLink label={back.label} onClick={back.onBack} />
        <PopIn popKey={status.tone}>
          <Chip tint={checkTint[status.tone]} size="sm" dot role="status">
            {status.label}
          </Chip>
        </PopIn>
      </div>
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{title}</h1>
        <p className="m-0 text-text-2">{body}</p>
      </div>
      {banner}
    </>
  );
}
