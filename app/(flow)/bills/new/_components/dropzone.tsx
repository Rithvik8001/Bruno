"use client";

import { motion } from "motion/react";
import { useRef, useState, type DragEvent } from "react";
import { MomentTile } from "@/components/ui/icon-3d";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { newBillCopy } from "../_data";

export interface DropzoneProps {
  disabled: boolean;
  waitSeconds?: number;
  onFile: (file: File) => void;
}

const ACCEPT = "image/*,.heic,.heif,application/pdf";

export function Dropzone({ disabled, waitSeconds = 0, onFile }: DropzoneProps) {
  const copy = newBillCopy.scan;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file && !disabled) onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files);
  };

  return (
    <motion.label
      data-tint="brand"
      aria-disabled={disabled || undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: T.t3, ease: EASE }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "grid min-h-65 place-items-center rounded-card border-[1.5px] border-dashed p-6 text-center",
        "transition-[background-color,border-color,opacity] duration-150 ease-standard",
        over ? "border-brand bg-brand-tint" : "border-border bg-surface hover:bg-surface-2",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
      )}
    >
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        aria-label={copy.fileLabel}
        disabled={disabled}
        onChange={(event) => {
          take(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
      />
      <span className="grid max-w-[30ch] justify-items-center gap-3.5">
        <MomentTile icon="receipt" tint="violet" size="lg" />
        <span className="grid gap-1">
          <span className="text-lead font-semibold">{over ? copy.dropActive : copy.dropTitle}</span>
          <span className="text-small text-text-2">{copy.dropSub}</span>
        </span>
        <span className="inline-flex h-10 items-center rounded-control bg-bg px-4 text-small font-semibold shadow-float">
          {waitSeconds > 0 ? copy.wait(waitSeconds) : copy.choose}
        </span>
      </span>
    </motion.label>
  );
}
