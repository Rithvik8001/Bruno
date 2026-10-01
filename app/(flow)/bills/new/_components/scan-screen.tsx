"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { StepSwap } from "@/components/motion/rise";
import type { ScanLine } from "@/components/patterns/receipt-scan";
import { useToast } from "@/components/ui/toast";
import { routes } from "@/lib/auth/rules";
import type { CurrencyCode } from "@/lib/currency";
import { AI_RETRY_GAP_MS, allowanceSpent, type Allowance } from "@/lib/ai/rules";
import { browserTimeZone } from "@/lib/browser-time-zone";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { useTimeline } from "@/lib/hooks/use-timeline";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { createScanUpload, discardScan, extractScan, type ScanSummary } from "@/lib/scans/actions";
import { newBillCopy } from "../_data";
import {
  EXTRACT_CREEP,
  extractProgress,
  ghostLines,
  previewRows,
  REVEAL,
  revealProgress,
  uploadProgress,
  type ScanPhase,
} from "../_lib/phase";
import { validateFile } from "../_lib/upload";
import { Dropzone } from "./dropzone";
import { QuotaBanner } from "./quota-banner";
import { ScanProgress } from "./scan-progress";
import { ScanDoneCard, ScanFailedCard } from "./scan-result-card";

const TOAST_MS = 6000;
const RETRY_GAP_SECONDS = AI_RETRY_GAP_MS / 1000;

export interface ScanScreenProps {
  groupId: string;
  currency: CurrencyCode;
  configured: boolean;
  quota: Allowance;
  onQuota: (quota: Allowance) => void;
  onRefreshQuota: () => Promise<void>;
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

export function ScanScreen({ groupId, currency, configured, quota, onQuota, onRefreshQuota, children }: ScanScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const copy = newBillCopy.scan;
  const [phase, setPhase] = useState<ScanPhase>({ kind: "idle" });
  const [navigating, startNavigation] = useTransition();
  const creep = useTimeline(EXTRACT_CREEP);
  const reveal = useTimeline(REVEAL);
  const cooldown = useCooldown(RETRY_GAP_SECONDS, false);
  const abortRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);
  const ghosts = useMemo(() => ghostLines(), []);

  const fail = useCallback(
    (reason: string | null, scanId?: string) => {
      buzz(HAPTICS.error);
      setPhase({ kind: "failed", reason });
      creep.reset();
      if (scanId) void discardScan({ scanId }).catch(() => undefined);
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
    const started = await createScanUpload({ groupId, contentType: check.mime, byteSize: check.size, timeZone: browserTimeZone() }).catch(() => null);
    if (started === null) {
      buzz(HAPTICS.error);
      cooldown.restart();
      toast({ message: copy.errors.upload, duration: TOAST_MS });
      return;
    }
    if (!started.ok) {
      if (started.error.code === "conflict") await onRefreshQuota();
      if (started.error.code === "rateLimited") cooldown.restart(started.error.retryAfter ?? RETRY_GAP_SECONDS);
      toast({ message: started.error.message, duration: TOAST_MS });
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
    const extracted = await extractScan({ scanId }).catch(() => null);
    if (cancelledRef.current) {
      void discardScan({ scanId }).catch(() => undefined);
      return;
    }
    creep.reset();
    if (extracted === null) {
      cooldown.restart();
      fail(null);
      return;
    }
    if (!extracted.ok) {
      await onRefreshQuota();
      if (extracted.error.code === "invalid") {
        buzz(HAPTICS.error);
        toast({ message: extracted.error.message, duration: TOAST_MS });
        setPhase({ kind: "idle" });
        return;
      }
      if (extracted.error.code === "rateLimited") {
        cooldown.restart(extracted.error.retryAfter ?? RETRY_GAP_SECONDS);
        buzz(HAPTICS.error);
        toast({ message: extracted.error.message, duration: TOAST_MS });
        void discardScan({ scanId }).catch(() => undefined);
        setPhase({ kind: "idle" });
        return;
      }
      if (extracted.error.code === "unknown") {
        cooldown.restart();
        fail(null);
        return;
      }
      fail(extracted.error.message);
      return;
    }
    onQuota(extracted.data.quota);
    setPhase({ kind: "revealing", summary: extracted.data.summary });
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
    if (scanId && phase.kind === "uploading") void discardScan({ scanId }).catch(() => undefined);
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

  const exhausted = allowanceSpent(quota);
  const manualHref = routes.manualBill(groupId);

  return (
    <StepSwap stepKey={phase.kind === "revealing" ? "extracting" : phase.kind} className="grid gap-3">
      {(phase.kind === "idle" || phase.kind === "failed") && !configured && (
        <p className="m-0 rounded-tile bg-surface px-4 py-3 text-small text-text-2">{copy.unavailable}</p>
      )}
      {phase.kind === "idle" && (
        <>
          <Dropzone disabled={exhausted || !configured || cooldown.active} waitSeconds={cooldown.remaining} onFile={(file) => void onFile(file)} />
          {exhausted && configured && <QuotaBanner quota={quota} />}
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
          <ScanFailedCard reason={phase.reason} manualHref={manualHref} retryIn={cooldown.remaining} onRetry={() => setPhase({ kind: "idle" })} />
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
