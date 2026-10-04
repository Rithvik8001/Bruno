"use client";

import { motion } from "motion/react";
import { useEffect, useReducer, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { exportPreview } from "@/lib/export/actions";
import { ALL_GROUPS, type ExportFilter, type ExportGroup, type ExportPreview } from "@/lib/export/rules";
import { useCooldown } from "@/lib/hooks/use-cooldown";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { buzz, HAPTICS } from "@/lib/motion/haptics";
import { EASE } from "@/lib/motion/tokens";
import { exportCopy } from "./_data";
import { requestExport, saveFile } from "./_lib/download";
import { exportReducer, filterKey, filterOf, initialExport, pickedKinds, requestOf, type ExportState } from "./_lib/state";
import { allTimePreview, summarize } from "./_lib/summary";
import { ExportDone, ExportDoneTitle } from "./export-done";
import { ExportForm, type ExportBanner } from "./export-form";
import { GroupPicker } from "./group-picker";

const PREVIEW_DELAY_MS = 250;
const MIN_PREPARE_MS = 600;
const FILL_SECONDS = 8;
const HOUR_SECONDS = 3600;
const MINUTE_SECONDS = 60;

interface PreviewEntry {
  readonly key: string;
  readonly data: ExportPreview | null;
}

export interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: readonly ExportGroup[];
  today: string;
  group?: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function bannerOf(state: ExportState, limited: boolean): ExportBanner | null {
  const copy = exportCopy.banner;
  if (state.phase.kind === "failed") return { tint: "red", title: copy.failed.title, body: state.phase.message ?? copy.failed.body };
  if (state.phase.kind === "limited" && limited) {
    return { tint: "amber", title: copy.limited.title, body: state.phase.seconds > MINUTE_SECONDS ? copy.limited.hour : copy.limited.minute };
  }
  return null;
}

export function ExportSheet({ open, onOpenChange, groups, today, group = ALL_GROUPS }: ExportSheetProps) {
  const [state, dispatch] = useReducer(exportReducer, initialExport(group, today));
  const [preview, setPreview] = useState<PreviewEntry | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  const controller = useRef<AbortController | null>(null);
  const cooldown = useCooldown(HOUR_SECONDS, false);
  const copy = exportCopy;

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      dispatch({ type: "reset", state: initialExport(group, today) });
      setPreview(null);
    }
  }

  useEffect(() => () => controller.current?.abort(), []);

  const counting = useDebouncedCallback((filter: ExportFilter) => {
    const key = filterKey(filter);
    exportPreview(filter)
      .then((result) => setPreview({ key, data: result.ok ? result.data : null }))
      .catch(() => setPreview({ key, data: null }));
  }, PREVIEW_DELAY_MS);

  const refresh = (next: Pick<ExportState, "group" | "range" | "from" | "to">) => {
    if (next.range === "all") counting.cancel();
    else counting.run(filterOf(next));
  };

  const filter = filterOf(state);
  const fresh = state.range === "all" ? { key: filterKey(filter), data: allTimePreview(groups, state.group) } : preview;
  const settled = fresh !== null && fresh.key === filterKey(filter);
  const shown = fresh?.data ?? null;
  const kinds = pickedKinds(state.kinds);
  const chosen = groups.find((entry) => entry.id === state.group) ?? null;
  const summary = summarize(shown, kinds, state.range, chosen ? chosen.name : null);
  const preparing = state.phase.kind === "preparing";
  const limited = cooldown.active;
  const blocked = kinds.length === 0 || !settled || summary.empty || limited;

  const stop = () => {
    controller.current?.abort();
    controller.current = null;
    dispatch({ type: "phase", phase: { kind: "idle" } });
  };

  const close = () => {
    if (preparing) stop();
    else onOpenChange(false);
  };

  const start = async () => {
    if (preparing || blocked) return;
    const abort = new AbortController();
    controller.current = abort;
    dispatch({ type: "phase", phase: { kind: "preparing" } });
    const [outcome] = await Promise.all([requestExport(requestOf(state), abort.signal), wait(MIN_PREPARE_MS)]);
    if (abort.signal.aborted || outcome.kind === "aborted") return;
    controller.current = null;
    if (outcome.kind === "ready") {
      saveFile(outcome.file);
      buzz(HAPTICS.celebrate);
      dispatch({ type: "done", file: outcome.file });
      return;
    }
    buzz(HAPTICS.error);
    if (outcome.kind === "refused" && outcome.error.code === "rateLimited") {
      const seconds = outcome.error.retryAfter ?? HOUR_SECONDS;
      cooldown.restart(seconds);
      dispatch({ type: "phase", phase: { kind: "limited", seconds } });
      return;
    }
    const explained = outcome.kind === "refused" && (outcome.error.code === "invalid" || outcome.error.code === "notFound");
    dispatch({ type: "phase", phase: { kind: "failed", message: explained ? outcome.error.message : null } });
  };

  const primaryLabel =
    kinds.length === 0
      ? copy.actions.pick
      : preparing
        ? copy.actions.preparing
        : state.phase.kind === "failed"
          ? copy.actions.retry
          : copy.actions.download(kinds.length);

  const footerClass = "flex flex-col-reverse gap-1 border-t border-line pt-4 sm:flex-row sm:justify-end sm:gap-2";

  const formActions = (
    <div className={footerClass}>
      <Button variant="tertiary" className="h-11" onClick={close}>
        {copy.actions.cancel}
      </Button>
      <Button
        size="lg"
        disabled={blocked}
        aria-busy={preparing || undefined}
        onClick={() => void start()}
        className="overflow-hidden sm:h-11 sm:px-4.5"
      >
        {preparing && (
          <motion.span
            aria-hidden
            initial={{ width: "6%" }}
            animate={{ width: "92%" }}
            transition={{ duration: FILL_SECONDS, ease: EASE }}
            className="absolute inset-y-0 left-0 bg-brand-hover"
          />
        )}
        {preparing ? (
          <Spinner className="relative" label={copy.actions.preparing} />
        ) : (
          !blocked && state.phase.kind !== "failed" && <Icon name="download" size={18} strokeWidth={2} className="relative" />
        )}
        <span className="relative">{primaryLabel}</span>
      </Button>
    </div>
  );

  const doneActions = (
    <div className={footerClass}>
      <Button
        variant="tertiary"
        className="h-11"
        onClick={() => {
          if (!state.file) return;
          buzz(HAPTICS.press);
          saveFile(state.file);
        }}
      >
        {copy.actions.again}
      </Button>
      <Button size="lg" className="sm:h-11 sm:px-5.5" onClick={() => onOpenChange(false)}>
        {copy.actions.done}
      </Button>
    </div>
  );

  const pickerTitle = (
    <span className="-ml-2.5 flex items-center gap-1">
      <IconButton icon="chevron-left" label={copy.groups.back} onClick={() => dispatch({ type: "view", view: "form" })} className="size-11" />
      {copy.groups.label}
    </span>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      actionsIn="card"
      className="sm:max-w-120"
      title={state.view === "done" ? <ExportDoneTitle /> : state.view === "picker" ? pickerTitle : copy.title}
      description={state.view === "done" ? copy.done.body : state.view === "picker" ? undefined : copy.body}
      actions={state.view === "done" ? doneActions : state.view === "picker" ? undefined : formActions}
    >
      {state.view === "form" && (
        <ExportForm
          state={state}
          today={today}
          group={chosen}
          groupCount={groups.length}
          counts={settled ? (shown?.counts ?? null) : null}
          summary={summary}
          banner={bannerOf(state, limited)}
          locked={preparing}
          onPickGroup={() => dispatch({ type: "view", view: "picker" })}
          onRange={(range) => {
            dispatch({ type: "range", range });
            refresh({ ...state, range });
          }}
          onFrom={(day) => {
            dispatch({ type: "from", day });
            refresh({ ...state, from: day, to: day > state.to ? day : state.to });
          }}
          onTo={(day) => {
            dispatch({ type: "to", day });
            refresh({ ...state, to: day, from: day < state.from ? day : state.from });
          }}
          onToggle={(kind) => dispatch({ type: "toggle", kind })}
        />
      )}
      {state.view === "picker" && (
        <GroupPicker
          groups={groups}
          value={state.group}
          onPick={(next) => {
            dispatch({ type: "group", group: next });
            refresh({ ...state, group: next });
          }}
        />
      )}
      {state.view === "done" && state.file && <ExportDone file={state.file} />}
    </Sheet>
  );
}
