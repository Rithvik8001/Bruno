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

export function defineAction<Schema extends z.ZodType, Output>(
  schema: Schema,
  handler: (input: z.output<Schema>, context: AppContext) => Promise<ActionResult<Output>>,
): (input: z.input<Schema>) => Promise<ActionResult<Output>> {
  return async (input) => {
    const context = await getAppContext();
    if (!context) return actionFail("unauthorized");
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: { code: "invalid", message: actionErrors.invalid, fields: fieldErrors(parsed.error) } };
    }
    try {
      return await handler(parsed.data, context);
    } catch (error) {
      console.error("[action] failed", error);
      return actionFail("unknown");
    }
  };
}
