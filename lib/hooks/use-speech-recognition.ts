"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface RecognitionAlternative {
  readonly transcript: string;
}

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: RecognitionAlternative | undefined;
}

interface RecognitionEvent {
  readonly results: ArrayLike<RecognitionResult>;
}

interface RecognitionErrorEvent {
  readonly error: string;
}

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => Recognition;

interface SpeechWindow {
  readonly SpeechRecognition?: RecognitionConstructor;
  readonly webkitSpeechRecognition?: RecognitionConstructor;
}

export type SpeechStatus = "idle" | "listening" | "denied";

export interface SpeechRecognitionState {
  readonly supported: boolean;
  readonly status: SpeechStatus;
  readonly finalText: string;
  readonly interimText: string;
  readonly start: () => void;
  readonly stop: () => void;
}

const DENIED = new Set(["not-allowed", "service-not-allowed"]);

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speech = window as unknown as SpeechWindow;
  return speech.SpeechRecognition ?? speech.webkitSpeechRecognition ?? null;
}

const subscribe = () => () => undefined;

export function useSpeechRecognition(onFinish: (transcript: string) => void): SpeechRecognitionState {
  const supported = useSyncExternalStore(
    subscribe,
    () => recognitionConstructor() !== null,
    () => false,
  );
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const heardRef = useRef("");
  const finishRef = useRef(onFinish);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    recognitionRef.current?.abort();
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    heardRef.current = "";
    setFinalText("");
    setInterimText("");
    let denied = false;
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const settled = results.filter((r) => r.isFinal).map((r) => r[0]?.transcript ?? "").join(" ");
      const pending = results.filter((r) => !r.isFinal).map((r) => r[0]?.transcript ?? "").join(" ");
      heardRef.current = `${settled} ${pending}`.replace(/\s+/g, " ").trim();
      setFinalText(settled.replace(/\s+/g, " ").trim());
      setInterimText(pending.replace(/\s+/g, " ").trim());
    };
    recognition.onerror = (event) => {
      if (DENIED.has(event.error)) denied = true;
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      setStatus(denied ? "denied" : "idle");
      setFinalText("");
      setInterimText("");
      if (heardRef.current !== "") finishRef.current(heardRef.current);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setStatus("listening");
    } catch {
      recognitionRef.current = null;
      setStatus("denied");
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, status, finalText, interimText, start, stop };
}
