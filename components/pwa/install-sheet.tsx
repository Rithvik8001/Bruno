"use client";

import type { ReactNode } from "react";
import { BrunoAppIcon } from "@/components/brand/bruno-mark";
import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useDevice } from "@/lib/hooks/use-device";
import { installSheetCopy } from "@/lib/pwa/messages";

const copy = installSheetCopy;

interface StepProps {
  index: number;
  title: string;
  body: string;
  short: string;
  shortTitle?: string;
  art: ReactNode;
}

function Step({ index, title, body, short, shortTitle, art }: StepProps) {
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 py-3 max-[359px]:min-h-14 max-[359px]:py-2">
      <span className="grid size-6 place-items-center rounded-full bg-brand-tint text-caption font-semibold text-brand">{index}</span>
      <span className="grid min-w-0 gap-0.5">
        <span className="font-medium">
          <span className="max-[359px]:hidden">{title}</span>
          <span className="min-[360px]:hidden">{shortTitle ?? title}</span>
        </span>
        <span className="text-footnote text-text-2 text-pretty">
          <span className="max-[359px]:hidden">{body}</span>
          <span className="min-[360px]:hidden">{short}</span>
        </span>
      </span>
      <span aria-hidden className="max-[359px]:hidden">
        {art}
      </span>
    </li>
  );
}

function SafariBar() {
  return (
    <span className="flex items-center gap-1.5 rounded-control bg-surface px-1.5 py-1 text-text-2">
      <span className="grid size-6 place-items-center">
        <Icon name="chevron-left" size={14} />
      </span>
      <span className="grid size-6 place-items-center rounded-xs bg-brand-tint text-brand">
        <Icon name="share" size={14} />
      </span>
      <span className="grid size-6 place-items-center">
        <Icon name="tabs" size={14} />
      </span>
    </span>
  );
}

function AddressBar() {
  return (
    <span className="flex items-center gap-1.5 rounded-control bg-surface py-1 pr-1 pl-3 text-caption text-muted">
      bruno.app
      <span className="grid size-6 place-items-center rounded-xs bg-brand-tint text-brand">
        <Icon name="share" size={13} />
      </span>
    </span>
  );
}

function AddPill() {
  return (
    <span className="flex items-center gap-1.5 rounded-control bg-surface px-2.5 py-1.5 text-caption font-medium whitespace-nowrap">
      {copy.addToHomeScreen}
      <Icon name="add-square" size={13} />
    </span>
  );
}

export interface InstallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallSheet({ open, onOpenChange }: InstallSheetProps) {
  const tablet = useDevice() === "ipad";
  const steps = tablet ? copy.tablet : copy.phone;
  const arts = [tablet ? <AddressBar key="share" /> : <SafariBar key="share" />, <AddPill key="add" />, <BrunoAppIcon key="open" size={32} className="rounded-[9px]" />];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      icon={{ moment: "phone" }}
      tint="blue"
      title={copy.title}
      description={
        <>
          <span className="max-[359px]:hidden">{copy.lead}</span>
          <span className="min-[360px]:hidden">{copy.leadShort}</span>
        </>
      }
      className="sm:max-w-105"
      actions={
        <Button size="md" onClick={() => onOpenChange(false)}>
          {copy.done}
        </Button>
      }
    >
      <ol className="m-0 -mt-2 grid list-none divide-y divide-line p-0">
        {steps.map((step, index) => (
          <Step
            key={step.title}
            index={index + 1}
            title={step.title}
            body={step.body}
            short={step.short}
            shortTitle={index === 2 ? copy.shortTitle : undefined}
            art={arts[index]}
          />
        ))}
      </ol>
    </Sheet>
  );
}
