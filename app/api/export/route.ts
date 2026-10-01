import { actionErrors, type ActionError } from "@/lib/actions/errors";
import { getAppContext } from "@/lib/auth/session";
import { exportBaseName, exportFile, exportSheets } from "@/lib/export/file";
import { countExport, exportScope, loadExport } from "@/lib/export/load";
import { exportMessages } from "@/lib/export/messages";
import { ALL_GROUPS, countRows, EXPORT_HEADERS, MAX_ROWS } from "@/lib/export/rules";
import { exportRequestSchema } from "@/lib/export/schema";
import { exportWindow } from "@/lib/export/window";
import { consumeRate } from "@/lib/rate-limit/limiter";

export const maxDuration = 60;

const MINUTE_SECONDS = 60;

const refuse = (status: number, error: ActionError) => Response.json({ ok: false, error }, { status, headers: { "cache-control": "no-store" } });

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return refuse(403, { code: "forbidden", message: exportMessages.badOrigin });
  const context = await getAppContext();
  if (!context) return refuse(401, { code: "unauthorized", message: actionErrors.unauthorized });
  const body: unknown = await request.json().catch(() => null);
  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join(".") || "form", issue.message]));
    return refuse(400, { code: "invalid", message: actionErrors.invalid, fields });
  }
  const input = parsed.data;
  const you = context.person.id;

  const window = await exportWindow(input);
  if (window.future) return refuse(400, { code: "invalid", message: exportMessages.future, fields: { to: exportMessages.future } });

  const verdict = await consumeRate("exportRun", you);
  if (!verdict.ok) {
    const message = verdict.retryAfter > MINUTE_SECONDS ? exportMessages.limited : exportMessages.limitedSoon;
    return refuse(429, { code: "rateLimited", message, retryAfter: verdict.retryAfter });
  }

  try {
    const scope = await exportScope(you, input.group);
    if (!scope) return refuse(404, { code: "notFound", message: exportMessages.groupGone });
    const expected = countRows(await countExport(scope, window), input.kinds);
    if (expected === 0) return refuse(404, { code: "notFound", message: exportMessages.nothing });
    if (expected > MAX_ROWS) return refuse(400, { code: "invalid", message: exportMessages.tooBig });

    const data = await loadExport(scope, window, input.kinds);
    const groupName = input.group === ALL_GROUPS ? null : (scope[0]?.name ?? null);
    const file = exportFile(exportSheets(data, input.kinds, you, new Date()), exportBaseName(groupName, window.today));
    if (!file) return refuse(404, { code: "notFound", message: exportMessages.nothing });

    return new Response(file.bytes, {
      headers: {
        "content-type": file.contentType,
        "content-disposition": `attachment; filename="${file.name}"`,
        "content-length": String(file.bytes.byteLength),
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        [EXPORT_HEADERS.name]: file.name,
        [EXPORT_HEADERS.rows]: String(file.rows),
        [EXPORT_HEADERS.files]: String(file.files),
      },
    });
  } catch (error) {
    console.error("[export] failed", error instanceof Error ? `${error.name}: ${error.message}` : "unknown error");
    return refuse(500, { code: "unknown", message: actionErrors.unknown });
  }
}
