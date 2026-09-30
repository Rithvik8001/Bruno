"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { StepSwap } from "@/components/motion/rise";
import type { ScanLine } from "@/components/patterns/receipt-scan";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import type { CurrencyCode } from "@/lib/currency";
import { useTimeline } from "@/lib/hooks/use-timeline";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { createScanUpload, discardScan, extractScan, scanQuota, type ScanSummary } from "@/lib/scans/actions";
import type { ScanQuota } from "@/lib/scans/quota";
import { newBillCopy } from "../_data";
import {
  EXTRACT_CREEP,
  extractProgress,
  ghostLines,
  previewRows,
  quotaExhausted,
  REVEAL,
  revealProgress,
  uploadProgress,
  type ScanPhase,
} from "../_lib/phase";
import { browserTimeZone, validateFile } from "../_lib/upload";
import { Dropzone } from "./dropzone";
import { QuotaBanner } from "./quota-banner";
import { ScanProgress } from "./scan-progress";
import { ScanDoneCard, ScanFailedCard } from "./scan-result-card";

const TOAST_MS = 6000;

export interface ScanScreenProps {
  groupId: string;
  currency: CurrencyCode;
  configured: boolean;
  quota: ScanQuota;
  onQuota: (quota: ScanQuota) => void;
  children: React.ReactNode;
}

function postFile(
  url: string,
  fields: Readonly<Record<string, string>>,
  file: File,
  onProgress: (fraction: number) => void,
): { promise: Promise<boolean>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  body.append("file", file);
  const promise = new Promise<boolean>((resolve) => {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.onabort = () => resolve(false);
    xhr.open("POST", url);
    xhr.send(body);
  });
  return { promise, abort: () => xhr.abort() };
}

export function ScanScreen({ groupId, currency, configured, quota, onQuota, children }: ScanScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const copy = newBillCopy.scan;
  const [phase, setPhase] = useState<ScanPhase>({ kind: "idle" });
  const [navigating, startNavigation] = useTransition();
  const creep = useTimeline(EXTRACT_CREEP);
  const reveal = useTimeline(REVEAL);
  const abortRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);
  const ghosts = useMemo(() => ghostLines(), []);

  const refreshQuota = useCallback(async () => {
    const result = await scanQuota({ timeZone: browserTimeZone() });
    if (result.ok) onQuota(result.data);
  }, [onQuota]);

  const fail = useCallback(
    (reason: string, scanId?: string) => {
      buzz(HAPTICS.error);
      setPhase({ kind: "failed", reason });
      creep.reset();
      if (scanId) void discardScan({ scanId });
    },
    [creep],
  );

  const onFile = async (file: File) => {
    const check = validateFile(file);
    if (!check.ok) {
      buzz(HAPTICS.error);
      toast({ message: check.reason === "type" ? copy.errors.type : copy.errors.size(check.maxMb) });
      return;
    }
    cancelledRef.current = false;
    const timeZone = browserTimeZone();
    const started = await createScanUpload({ groupId, contentType: check.mime, byteSize: check.size, timeZone });
    if (!started.ok) {
      if (started.error.code === "conflict") await refreshQuota();
      toast({ message: started.error.message });
      return;
    }
    const { scanId, uploadUrl, fields } = started.data;
    setPhase({ kind: "uploading", scanId, fraction: 0 });
    const upload = postFile(uploadUrl, fields, file, (fraction) => setPhase((p) => (p.kind === "uploading" ? { ...p, fraction } : p)));
    abortRef.current = upload.abort;
    const uploaded = await upload.promise;
    abortRef.current = null;
    if (cancelledRef.current) return;
    if (!uploaded) {
      fail(copy.errors.upload, scanId);
      return;
    }
    setPhase({ kind: "extracting", scanId });
    creep.start();
    const extracted = await extractScan({ scanId, timeZone });
    if (cancelledRef.current) {
      void discardScan({ scanId });
      return;
    }
    creep.reset();
    if (!extracted.ok) {
      await refreshQuota();
      if (extracted.error.code === "invalid") {
        buzz(HAPTICS.error);
        toast({ message: extracted.error.message, duration: TOAST_MS });
        setPhase({ kind: "idle" });
        return;
      }
      fail(extracted.error.message);
      return;
    }
    onQuota({ ...quota, used: quota.used + 1, left: Math.max(0, quota.left - 1) });
    setPhase({ kind: "revealing", summary: extracted.data });
    reveal.start();
  };

  useEffect(() => {
    if (phase.kind !== "revealing" || reveal.running || reveal.progress === null) return;
    const timer = setTimeout(() => setPhase({ kind: "done", summary: phase.summary }), 700);
    return () => clearTimeout(timer);
  }, [phase, reveal.running, reveal.progress]);

  const cancel = () => {
    cancelledRef.current = true;
    abortRef.current?.();
    creep.reset();
    const scanId = phase.kind === "uploading" || phase.kind === "extracting" ? phase.scanId : null;
    if (scanId && phase.kind === "uploading") void discardScan({ scanId });
    setPhase({ kind: "idle" });
  };

  const review = (summary: ScanSummary) =>
    startNavigation(() => {
      router.push(routes.scanReview(summary.scanId));
    });

  const summaryLines = (summary: ScanSummary): readonly ScanLine[] =>
    Array.from({ length: summary.itemCount }, (_, i) => ({
      id: `line-${i}`,
      name: "",
      price: null,
      category: null,
      tint: "muted",
      ghostWidth: "60%",
    }));

  const exhausted = quotaExhausted(quota);
  const manualHref = routes.manualBill(groupId);

  return (
    <StepSwap stepKey={phase.kind === "revealing" ? "extracting" : phase.kind} className="grid gap-3">
      {(phase.kind === "idle" || phase.kind === "failed") && !configured && (
        <p className="m-0 rounded-tile bg-surface px-4 py-3 text-small text-text-2">{copy.unavailable}</p>
      )}
      {phase.kind === "idle" && (
        <>
          <Dropzone disabled={exhausted || !configured} onFile={(file) => void onFile(file)} />
          {exhausted && configured && <QuotaBanner limit={quota.limit} />}
          {children}
        </>
      )}
      {phase.kind === "uploading" && (
        <ScanProgress
          merchant={null}
          rows={ghosts}
          overflow={0}
          total={null}
          currency={currency}
          progress={uploadProgress(phase.fraction)}
          cancellable
          onCancel={cancel}
        />
      )}
      {phase.kind === "extracting" && (
        <ScanProgress
          merchant={null}
          rows={ghosts}
          overflow={0}
          total={null}
          currency={currency}
          progress={extractProgress(creep.progress)}
          cancellable
          onCancel={cancel}
        />
      )}
      {phase.kind === "revealing" && (
        <RevealProgress summary={phase.summary} currency={currency} progress={revealProgress(reveal.progress)} lines={summaryLines(phase.summary)} />
      )}
      {phase.kind === "done" && <ScanDoneCard summary={phase.summary} pending={navigating} onReview={() => review(phase.summary)} />}
      {phase.kind === "failed" && (
        <>
          <ScanFailedCard reason={phase.reason} manualHref={manualHref} onRetry={() => setPhase({ kind: "idle" })} />
          {children}
        </>
      )}
    </StepSwap>
  );
}

interface RevealProgressProps {
  summary: ScanSummary;
  currency: CurrencyCode;
  progress: number;
  lines: readonly ScanLine[];
}

function RevealProgress({ summary, currency, progress, lines }: RevealProgressProps) {
  const { rows, overflow } = previewRows(lines);
  return (
    <ScanProgress
      merchant={summary.merchant}
      rows={rows}
      overflow={overflow}
      total={summary.total}
      currency={currency}
      progress={progress}
      cancellable={false}
      onCancel={() => undefined}
    />
  );
}
