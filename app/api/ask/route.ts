import { actionErrors, type ActionError } from "@/lib/actions/errors";
import { startAsk } from "@/lib/ask/ask";
import { askMessages } from "@/lib/ask/messages";
import type { AskStreamEvent } from "@/lib/ask/result";
import { askSchema } from "@/lib/ask/schema";
import { getAppContext } from "@/lib/auth/session";

export const maxDuration = 60;

const refuse = (status: number, error: ActionError) =>
  Response.json({ ok: false, error }, { status });

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  try {
    return (
      new URL(origin).host ===
      (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return refuse(403, { code: "forbidden", message: askMessages.badOrigin });
  const context = await getAppContext();
  if (!context)
    return refuse(401, {
      code: "unauthorized",
      message: actionErrors.unauthorized,
    });
  const body: unknown = await request.json().catch(() => null);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((issue) => [
        issue.path.join(".") || "form",
        issue.message,
      ]),
    );
    return refuse(400, {
      code: "invalid",
      message: fields.text ?? actionErrors.invalid,
      fields,
    });
  }

  const started = await startAsk(parsed.data, context.person).catch(
    (error: unknown) => {
      console.error(
        "[ask] start failed",
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : "unknown error",
      );
      return null;
    },
  );
  if (!started)
    return refuse(500, { code: "unknown", message: actionErrors.unknown });
  if (!started.ok) return refuse(started.status, started.error);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AskStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          return;
        }
      };
      const last = await started.run(
        (step) => send({ t: "step", step }),
        request.signal,
      );
      if (last) send(last);
      try {
        controller.close();
      } catch {
        return;
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
