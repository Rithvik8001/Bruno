import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, NoObjectGeneratedError, NoOutputGeneratedError, Output } from "ai";
import { tellApiKey } from "./config";
import { tellExtractionSchema, tellInstructions, type TellExtraction, type TellPromptContext } from "./extraction";
import type { TellFailure } from "./messages";
import { forPrompt } from "./guard";
import { TELL_MAX_OUTPUT_TOKENS, TELL_MODEL, TELL_REASONING, TELL_TIMEOUT_MS } from "./rules";

export interface TellUsage {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
}

export type TellOutcome =
  | { readonly ok: true; readonly extraction: TellExtraction; readonly usage: TellUsage; readonly model: string }
  | { readonly ok: false; readonly failure: TellFailure };

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export async function runTell(text: string, context: TellPromptContext): Promise<TellOutcome> {
  const openai = createOpenAI({ apiKey: tellApiKey() });
  try {
    const result = await generateText({
      model: openai(TELL_MODEL),
      output: Output.object({ schema: tellExtractionSchema }),
      instructions: tellInstructions(context),
      messages: [{ role: "user", content: [{ type: "text", text: `<message>${forPrompt(text)}</message>` }] }],
      providerOptions: { openai: { reasoningEffort: TELL_REASONING, strictJsonSchema: true } },
      maxRetries: 0,
      maxOutputTokens: TELL_MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(TELL_TIMEOUT_MS),
    });
    return {
      ok: true,
      extraction: result.output,
      usage: { inputTokens: result.usage.inputTokens ?? null, outputTokens: result.usage.outputTokens ?? null },
      model: result.finalStep.response.modelId,
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) || NoOutputGeneratedError.isInstance(error)) return { ok: false, failure: "vague" };
    if (isTimeout(error)) return { ok: false, failure: "timeout" };
    throw error;
  }
}
