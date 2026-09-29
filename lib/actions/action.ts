import "server-only";
import type { z } from "zod";
import { getAppContext, type AppContext } from "@/lib/auth/session";
import { actionErrors, actionFail, type ActionResult } from "./errors";

function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ??= issue.message;
  }
  return fields;
}

function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): { ok: true; data: z.output<Schema> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    result: { ok: false, error: { code: "invalid", message: actionErrors.invalid, fields: fieldErrors(parsed.error) } },
  };
}

async function run<Output>(handler: () => Promise<ActionResult<Output>>): Promise<ActionResult<Output>> {
  try {
    return await handler();
  } catch (error) {
    console.error("[action] failed", error);
    return actionFail("unknown");
  }
}

export function defineAction<Schema extends z.ZodType, Output>(
  schema: Schema,
  handler: (input: z.output<Schema>, context: AppContext) => Promise<ActionResult<Output>>,
): (input: z.input<Schema>) => Promise<ActionResult<Output>> {
  return async (input) => {
    const context = await getAppContext();
    if (!context) return actionFail("unauthorized");
    const parsed = parseInput(schema, input);
    if (!parsed.ok) return parsed.result;
    return run(() => handler(parsed.data, context));
  };
}

export interface PublicContext {
  readonly viewer: AppContext | null;
}

export function definePublicAction<Schema extends z.ZodType, Output>(
  schema: Schema,
  handler: (input: z.output<Schema>, context: PublicContext) => Promise<ActionResult<Output>>,
): (input: z.input<Schema>) => Promise<ActionResult<Output>> {
  return async (input) => {
    const viewer = await getAppContext();
    const parsed = parseInput(schema, input);
    if (!parsed.ok) return parsed.result;
    return run(() => handler(parsed.data, { viewer }));
  };
}
