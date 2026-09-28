"use client";

import { useSyncExternalStore } from "react";
import { homeCopy } from "../_data";
import { greetingFor } from "../_lib/greeting";

const MINUTE_MS = 60_000;

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, MINUTE_MS);
  return () => clearInterval(id);
}

const currentHour = () => {
  const now = new Date();
  return now.getDay() * 24 + now.getHours();
};

export function Greeting({ firstName }: { firstName: string }) {
  const stamp = useSyncExternalStore(subscribe, currentHour, () => null);
  const text =
    stamp === null
      ? homeCopy.fallbackGreeting(firstName)
      : greetingFor(new Date(), firstName);
  return <span className="text-small font-medium text-text-2">{text}</span>;
}
