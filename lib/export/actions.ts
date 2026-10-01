"use server";

import { defineAction } from "@/lib/actions/action";
import { actionFail, actionInvalid, actionOk, actionRateLimited } from "@/lib/actions/errors";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { countExport, exportScope } from "./load";
import { exportMessages } from "./messages";
import type { ExportPreview } from "./rules";
import { exportPreviewSchema } from "./schema";
import { exportWindow } from "./window";

export const exportPreview = defineAction(exportPreviewSchema, async (input, { person }) => {
  const verdict = await consumeRate("exportPreview", person.id);
  if (!verdict.ok) return actionRateLimited(verdict.retryAfter);
  const window = await exportWindow(input);
  if (window.future) return actionInvalid({ to: exportMessages.future }, exportMessages.future);
  const scope = await exportScope(person.id, input.group);
  if (!scope) return actionFail("notFound", exportMessages.groupGone);
  return actionOk<ExportPreview>({ counts: await countExport(scope, window), groups: scope.length });
});
