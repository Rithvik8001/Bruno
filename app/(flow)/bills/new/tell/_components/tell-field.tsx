"use client";

import { motion, type Transition } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { Rise } from "@/components/motion/rise";
import { StopListeningButton } from "@/components/patterns/stop-listening-button";
import { Button } from "@/components/ui/button";
import type { SpeechRecognitionState } from "@/lib/hooks/use-speech-recognition";
import { T } from "@/lib/motion/tokens";
import { TELL_COUNT_FROM, TELL_TEXT_MAX } from "@/lib/tell/rules";
import { cn } from "@/lib/utils/cn";
import { tellCopy } from "../_data";

export interface TellFieldProps {
  text: string;
  placeholder: string;
  speech: SpeechRecognitionState;
  onText: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
  onMic: () => void;
}

const CARET: Transition = { duration: 1, ease: "linear", repeat: Infinity, times: [0, 0.5, 0.5, 1] };

export function TellField({ text, placeholder, speech, onText, onFocusChange, onMic }: TellFieldProps) {
  const copy = tellCopy.compose;
  const [focused, setFocused] = useState(false);
  const listening = speech.status === "listening";
  const denied = speech.status === "denied";
  const length = text.length;
  const over = length > TELL_TEXT_MAX && !listening;
  const empty = text.trim() === "";
  const heard = [text.trim(), speech.finalText].filter(Boolean).join(" ");
  const hint = listening
    ? copy.hint.listening
    : denied
      ? copy.hint.denied
      : length > TELL_COUNT_FROM
        ? copy.count(length)
        : empty
          ? speech.supported
            ? copy.hint.mic
            : copy.hint.type
          : "";

  const focus = (value: boolean) => {
    setFocused(value);
    onFocusChange(value);
  };

  return (
    <div className="grid gap-3">
      <div
        className={cn(
          "relative rounded-card border transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
          over
            ? "border-red bg-bg shadow-[0_0_0_3px_var(--red-bg)]"
            : focused || listening
              ? "border-brand bg-bg shadow-[0_0_0_3px_var(--brand-tint)]"
              : "border-transparent bg-surface",
        )}
      >
        {listening ? (
          <div aria-live="polite" className="min-h-33 px-4 pt-4 pb-1 text-lead wrap-anywhere">
            {heard === "" && speech.interimText === "" ? (
              <span className="text-muted">{copy.listeningEmpty}</span>
            ) : (
              <>
                <span>{heard}</span>
                {speech.interimText !== "" && <span className="text-muted"> {speech.interimText}</span>}
              </>
            )}
            <motion.span
              aria-hidden
              className="ml-0.5 inline-block h-5 w-0.5 bg-brand align-[-4px]"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={CARET}
            />
          </div>
        ) : (
          <textarea
            value={text}
            rows={4}
            aria-label={copy.fieldLabel}
            aria-invalid={over || undefined}
            placeholder={placeholder}
            onChange={(e) => onText(e.target.value)}
            onFocus={() => focus(true)}
            onBlur={() => focus(false)}
            className="block min-h-33 w-full resize-none border-0 bg-transparent px-4 pt-4 pb-1 text-lead text-text outline-none placeholder:text-muted"
          />
        )}
        <div className="flex min-h-14 items-center justify-between gap-2.5 pt-1 pr-2 pb-2 pl-4">
          <span
            className={cn(
              "min-w-0 text-footnote",
              over ? "font-semibold text-red" : listening ? "font-semibold text-brand" : "text-muted",
            )}
          >
            {hint}
          </span>
          {listening ? (
            <StopListeningButton label={copy.stop} ariaLabel={copy.stopLabel} onStop={speech.stop} />
          ) : (
            speech.supported && (
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
            )
          )}
        </div>
      </div>

      {denied && (
        <Rise
          role="status"
          data-tint="amber"
          transition={{ duration: T.t2 }}
          className="flex flex-wrap items-center gap-3 rounded-tile bg-tint-bg py-3 pr-2 pl-3.5 text-small text-tint"
        >
          <span className="min-w-48 flex-1">
            <span className="font-semibold">{copy.denied.title}</span> {copy.denied.body}
          </span>
          <Button variant="elevated" size="md" onClick={onMic} className="h-11 text-small">
            {copy.denied.retry}
          </Button>
        </Rise>
      )}

      {over && (
        <Rise
          role="alert"
          data-tint="red"
          transition={{ duration: T.t2 }}
          className="flex items-center gap-2.5 rounded-tile bg-tint-bg px-3.5 py-3 text-small text-tint"
        >
          <Icon name="alert" size={18} strokeWidth={2} className="shrink-0" />
          <span>
            <span className="font-semibold">{copy.over.title}</span> {copy.over.body}
          </span>
        </Rise>
      )}
    </div>
  );
}
