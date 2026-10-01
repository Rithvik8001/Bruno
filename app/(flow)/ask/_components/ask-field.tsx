"use client";

import { motion, type Transition } from "motion/react";
import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { StopListeningButton } from "@/components/patterns/stop-listening-button";
import { Button } from "@/components/ui/button";
import { ASK_COUNT_FROM, ASK_TEXT_MAX } from "@/lib/ask/rules";
import type { SpeechRecognitionState } from "@/lib/hooks/use-speech-recognition";
import { T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";
import { askCopy } from "../_data";

export interface AskFieldProps {
  text: string;
  placeholder: string;
  compact: boolean;
  speech: SpeechRecognitionState;
  canAsk: boolean;
  waitSeconds: number;
  onText: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
  onMic: () => void;
  onAsk: () => void;
}

const CARET: Transition = { duration: 1, ease: "linear", repeat: Infinity, times: [0, 0.5, 0.5, 1] };

export function AskField({ text, placeholder, compact, speech, canAsk, waitSeconds, onText, onFocusChange, onMic, onAsk }: AskFieldProps) {
  const copy = askCopy.field;
  const [focused, setFocused] = useState(false);
  const listening = speech.status === "listening";
  const denied = speech.status === "denied";
  const length = text.length;
  const over = length > ASK_TEXT_MAX && !listening;
  const empty = text.trim() === "";
  const heard = [text.trim(), speech.finalText].filter(Boolean).join(" ");
  const hint = listening
    ? copy.hint.listening
    : denied
      ? copy.hint.denied
      : length > ASK_COUNT_FROM
        ? copy.count(length, ASK_TEXT_MAX)
        : empty
          ? speech.supported
            ? copy.hint.mic
            : copy.hint.type
          : copy.hint.cost;

  const focus = (value: boolean) => {
    setFocused(value);
    onFocusChange(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canAsk) onAsk();
  };

  const height = compact ? "min-h-10" : "min-h-16.5";

  return (
    <div className="grid gap-2.5">
      <div
        className={cn(
          "rounded-card border transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
          over
            ? "border-red bg-bg shadow-[0_0_0_3px_var(--red-bg)]"
            : focused || listening
              ? "border-brand bg-bg shadow-[0_0_0_3px_var(--brand-tint)]"
              : "border-transparent bg-surface",
        )}
      >
        {listening ? (
          <div aria-live="polite" className={cn("px-4 pt-3.5 text-lead wrap-anywhere", height)}>
            {heard === "" && speech.interimText === "" ? (
              <span className="text-muted">{copy.listeningEmpty}</span>
            ) : (
              <>
                <span>{heard}</span>
                {speech.interimText !== "" && <span className="text-muted"> {speech.interimText}</span>}
              </>
            )}
            <motion.span aria-hidden className="ml-0.5 inline-block h-5 w-0.5 bg-brand align-[-4px]" animate={{ opacity: [1, 1, 0, 0] }} transition={CARET} />
          </div>
        ) : (
          <textarea
            value={text}
            rows={compact ? 1 : 2}
            aria-label={copy.label}
            aria-invalid={over || undefined}
            placeholder={placeholder}
            enterKeyHint="send"
            onChange={(event) => onText(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => focus(true)}
            onBlur={() => focus(false)}
            className={cn("block w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-0 text-lead text-text outline-none placeholder:text-muted", height)}
          />
        )}
        <div className="flex min-h-14.5 items-center gap-2 pt-1.5 pr-2 pb-2 pl-4">
          <span className={cn("min-w-0 flex-1 text-footnote", over ? "font-semibold text-red" : listening ? "font-semibold text-brand" : "text-muted")}>{hint}</span>
          {listening ? (
            <StopListeningButton label={copy.stop} ariaLabel={copy.stopLabel} onStop={speech.stop} />
          ) : (
            <>
              {speech.supported && (
                <motion.button
                  type="button"
                  onClick={onMic}
                  aria-label={denied ? copy.micBlocked : copy.dictate}
                  data-tint="amber"
                  {...pressMotion()}
                  className={cn(
                    "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-150 ease-standard hover:bg-brand-tint hover:text-brand",
                    denied ? "bg-tint-bg text-tint" : "bg-surface-2 text-text",
                  )}
                >
                  <Icon name={denied ? "mic-off" : "mic"} size={20} strokeWidth={1.9} />
                </motion.button>
              )}
              <Button size="md" disabled={!canAsk} onClick={onAsk} className="h-11 shrink-0 gap-1.5 rounded-full pr-4.5 pl-3.5 text-body font-semibold disabled:bg-surface-2">
                <Icon name="sparkle" size={15} />
                {waitSeconds > 0 ? copy.wait(waitSeconds) : copy.ask}
              </Button>
            </>
          )}
        </div>
      </div>

      {denied && (
        <Rise role="status" data-tint="amber" transition={{ duration: T.t2 }} className="flex flex-wrap items-center gap-3 rounded-tile bg-tint-bg py-3 pr-2 pl-3.5 text-small text-tint">
          <span className="min-w-48 flex-1">
            <span className="font-semibold">{copy.denied.title}</span> {copy.denied.body}
          </span>
          <Button variant="elevated" size="md" onClick={onMic} className="h-11 text-small">
            {copy.denied.retry}
          </Button>
        </Rise>
      )}

      {over && (
        <Rise role="alert" data-tint="red" transition={{ duration: T.t2 }} className="flex items-center gap-2.5 rounded-tile bg-tint-bg px-3.5 py-3 text-small text-tint">
          <Icon name="alert" size={18} strokeWidth={2} className="shrink-0" />
          <span>
            <span className="font-semibold">{copy.over.title}</span> {copy.over.body}
          </span>
        </Rise>
      )}
    </div>
  );
}
