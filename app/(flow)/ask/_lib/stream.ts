import type { ActionError } from "@/lib/actions/errors";
import type { Allowance } from "@/lib/ai/rules";
import type { AskDone, AskStep, AskStreamEvent } from "@/lib/ask/result";
import type { AskInput } from "@/lib/ask/schema";
import { routes } from "@/lib/auth/rules";

export type AskStreamResult =
  | { readonly kind: "done"; readonly done: AskDone }
  | { readonly kind: "refused"; readonly error: ActionError }
  | { readonly kind: "failed"; readonly message: string | null; readonly quota: Allowance | null }
  | { readonly kind: "aborted" };

function parseEvent(line: string): AskStreamEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    return typeof value === "object" && value !== null && "t" in value ? (value as AskStreamEvent) : null;
  } catch {
    return null;
  }
}

function parseRefusal(value: unknown): ActionError | null {
  if (typeof value !== "object" || value === null || !("error" in value)) return null;
  const error = (value as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error && "message" in error ? (error as ActionError) : null;
}

export async function askStream(input: AskInput, signal: AbortSignal, onStep: (step: AskStep) => void): Promise<AskStreamResult> {
  try {
    const response = await fetch(routes.askApi, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    if (!response.ok || !response.body) {
      const refusal = parseRefusal(await response.json().catch(() => null));
      return refusal ? { kind: "refused", error: refusal } : { kind: "failed", message: null, quota: null };
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let last: AskStreamResult = { kind: "failed", message: null, quota: null };
    const handle = (line: string) => {
      const event = line.trim() === "" ? null : parseEvent(line);
      if (!event) return;
      if (event.t === "step") onStep(event.step);
      else if (event.t === "done") last = { kind: "done", done: event };
      else last = { kind: "failed", message: event.message, quota: event.quota };
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(handle);
    }
    handle(buffer + decoder.decode());
    return last;
  } catch {
    return signal.aborted ? { kind: "aborted" } : { kind: "failed", message: null, quota: null };
  }
}
