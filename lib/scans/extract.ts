import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { minorUnitsOf, type CurrencyCode } from "@/lib/currency";
import { scanEnv } from "./config";
import {
  extractionInstructions,
  extractionSchema,
  type Extraction,
} from "./extraction";
import type { ScanFailure } from "./messages";
import { EXTRACT_TIMEOUT_MS, SCAN_MODEL } from "./rules";
import type { ModelFile } from "./storage";

export interface ExtractionUsage {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
}

export type ExtractionOutcome =
  | {
      readonly ok: true;
      readonly extraction: Extraction;
      readonly usage: ExtractionUsage;
      readonly model: string;
    }
  | { readonly ok: false; readonly failure: ScanFailure };

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

export async function runExtraction(
  files: readonly ModelFile[],
  currency: CurrencyCode,
): Promise<ExtractionOutcome> {
  const openai = createOpenAI({ apiKey: scanEnv().openAiKey });
  try {
    const result = await generateText({
      model: openai(SCAN_MODEL),
      output: Output.object({ schema: extractionSchema }),
      instructions: extractionInstructions(currency, minorUnitsOf(currency)),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract every line from this receipt${files.length > 1 ? ` (${files.length} pages)` : ""}. Amounts in ${currency}.`,
            },
            ...files.map((file) => ({
              type: "file" as const,
              mediaType: file.mediaType,
              data: file.data,
              filename: file.filename,
            })),
          ],
        },
      ],
      providerOptions: {
        openai: { reasoningEffort: "none", strictJsonSchema: true },
      },
      abortSignal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
    });
    return {
      ok: true,
      extraction: result.output,
      usage: {
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
      },
      model: result.response.modelId,
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error))
      return { ok: false, failure: "unreadable" };
    if (isTimeout(error)) return { ok: false, failure: "timeout" };
    throw error;
  }
}
