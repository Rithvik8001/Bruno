"use client";

import { useState } from "react";
import type { DeleteStatus } from "@/lib/account/rules";
import type { ExportGroup } from "@/lib/export/rules";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { settingsCopy } from "../_data";
import { DeleteAccountSheet, refreshDeleteStatus } from "./delete-account-sheet";

export interface DeleteAccountRowProps {
  initial: DeleteStatus;
  exportGroups: readonly ExportGroup[];
  today: string;
}

export function DeleteAccountRow({ initial, exportGroups, today }: DeleteAccountRowProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(initial);
  const copy = settingsCopy.deleteAccount;

  const show = () => {
    buzz(HAPTICS.press);
    setOpen(true);
    void refreshDeleteStatus().then((fresh) => {
      if (fresh) setStatus(fresh);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 bg-transparent text-left font-medium text-red"
      >
        {copy.row}
        {status.kind === "blocked" && <span className="text-right text-footnote font-normal text-muted">{copy.hint}</span>}
      </button>
      <DeleteAccountSheet open={open} onOpenChange={setOpen} status={status} onStatus={setStatus} exportGroups={exportGroups} today={today} />
    </>
  );
}
