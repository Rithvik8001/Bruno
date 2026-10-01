"use client";

import { useState } from "react";
import { exportCopy } from "@/app/(app)/_components/export/_data";
import { ExportSheet } from "@/app/(app)/_components/export/export-sheet";
import type { ExportGroup } from "@/lib/export/rules";

export interface ExportRowProps {
  groups: readonly ExportGroup[];
  today: string;
}

export function ExportRow({ groups, today }: ExportRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 bg-transparent text-left font-medium"
      >
        {exportCopy.entry.label}
        <span className="text-footnote font-normal text-text-2">{exportCopy.entry.hint}</span>
      </button>
      <ExportSheet open={open} onOpenChange={setOpen} groups={groups} today={today} />
    </>
  );
}
