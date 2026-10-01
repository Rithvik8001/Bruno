import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, hasToolCall, isStepCount } from "ai";
import { forPrompt } from "@/lib/tell/guard";
import type { AskContext } from "./account";
import { askApiKey } from "./config";
import { askInstructions, type AskTurn } from "./instructions";
import { ASK_MAX_OUTPUT_TOKENS, ASK_MODEL, ASK_REASONING, ASK_STEPS_MAX, ASK_STEP_TIMEOUT_MS, ASK_TIMEOUT_MS, type AskFailure } from "./rules";
import { askToolkit, TERMINAL_TOOLS, type AskCall, type AskTerminal } from "./tools";

export interface AskUsage {
  readonly model: string | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly steps: number | null;
}

export type AskOutcome =
  | { readonly kind: "done"; readonly terminal: AskTerminal; readonly calls: readonly AskCall[]; readonly usage: AskUsage }
  | { readonly kind: "failed"; readonly failure: AskFailure; readonly usage: AskUsage | null }
  | { readonly kind: "cancelled" };

export interface AskRun {
  readonly question: string;
  readonly ctx: AskContext;
  readonly turns: readonly AskTurn[];
  readonly resolved: readonly string[];
  readonly allowClarify: boolean;
  readonly signal: AbortSignal;
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export async function runAsk({ question, ctx, turns, resolved, allowClarify, signal }: AskRun): Promise<AskOutcome> {
  const openai = createOpenAI({ apiKey: askApiKey() });
  const kit = askToolkit(ctx, allowClarify, question);
  try {
    const result = await generateText({
      model: openai(ASK_MODEL),
      instructions: askInstructions({ account: ctx.account, today: ctx.today, turns, resolved, allowClarify }),
      messages: [{ role: "user", content: [{ type: "text", text: `<question>${forPrompt(question)}</question>` }] }],
      tools: kit.tools,
      toolChoice: "required",
      stopWhen: [hasToolCall(...TERMINAL_TOOLS), isStepCount(ASK_STEPS_MAX)],
      providerOptions: { openai: { reasoningEffort: ASK_REASONING } },
      maxRetries: 0,
      maxOutputTokens: ASK_MAX_OUTPUT_TOKENS,
      timeout: { totalMs: ASK_TIMEOUT_MS, stepMs: ASK_STEP_TIMEOUT_MS },
      abortSignal: signal,
    });
    const usage: AskUsage = {
      model: result.finalStep.response.modelId,
      inputTokens: result.usage.inputTokens ?? null,
      outputTokens: result.usage.outputTokens ?? null,
      steps: result.steps.length,
    };
    const last = [...ctx.cards.values()].at(-1);
    const terminal = kit.terminal() ?? (last ? ({ kind: "answer", card: last } satisfies AskTerminal) : null);
    return terminal ? { kind: "done", terminal, calls: kit.calls(), usage } : { kind: "failed", failure: "failed", usage };
  } catch (error) {
    if (signal.aborted) return { kind: "cancelled" };
    if (isTimeout(error)) return { kind: "failed", failure: "timeout", usage: null };
    console.error("[ask] agent failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown error");
    return { kind: "failed", failure: "failed", usage: null };
  }
}
