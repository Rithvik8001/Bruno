"use client";

import { Rise } from "@/components/motion/rise";
import { ReceiptScan, type ScanRow } from "@/components/patterns/receipt-scan";
import { Button } from "@/components/ui/button";
import type { CurrencyCode } from "@/lib/currency";
import type { Cents } from "@/lib/money";
import { newBillCopy, scanCaptions } from "../_data";

export interface ScanProgressProps {
  merchant: string | null;
  rows: readonly ScanRow[];
  overflow: number;
  total: Cents | null;
  currency: CurrencyCode;
  progress: number;
  cancellable: boolean;
  onCancel: () => void;
}

export function ScanProgress({ merchant, rows, overflow, total, currency, progress, cancellable, onCancel }: ScanProgressProps) {
  return (
    <Rise className="grid justify-items-center gap-4">
      <ReceiptScan merchant={merchant} lines={rows} overflow={overflow} total={total} currency={currency} captions={scanCaptions} progress={progress} />
      {cancellable && (
        <Button variant="tertiary" size="md" onClick={onCancel}>
          {newBillCopy.scan.cancel}
        </Button>
      )}
    </Rise>
  );
}
