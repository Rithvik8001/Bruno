import { actionErrors, type ActionError } from "@/lib/actions/errors";
import { getAppContext } from "@/lib/auth/session";
import { pushResubscribeSchema } from "@/lib/push/schema";
import { replaceSubscription } from "@/lib/push/subscriptions";
import { pushConfigured } from "@/lib/push/vapid";
import { consumeRate } from "@/lib/rate-limit/limiter";
import { isSameOrigin } from "@/lib/security/same-origin";

const refuse = (status: number, error: ActionError) =>
  Response.json(
    { ok: false, error },
    { status, headers: { "cache-control": "no-store" } },
  );

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request))
    return refuse(403, { code: "forbidden", message: actionErrors.forbidden });
  if (!pushConfigured())
    return refuse(409, { code: "conflict", message: actionErrors.conflict });
  const context = await getAppContext();
  if (!context)
    return refuse(401, {
      code: "unauthorized",
      message: actionErrors.unauthorized,
    });
  const parsed = pushResubscribeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return refuse(400, { code: "invalid", message: actionErrors.invalid });
  const verdict = await consumeRate("pushWrite", context.person.id);
  if (!verdict.ok)
    return refuse(429, {
      code: "rateLimited",
      message: actionErrors.rateLimited,
      retryAfter: verdict.retryAfter,
    });
  const { oldEndpoint, subscription } = parsed.data;
  await replaceSubscription(
    context.person.id,
    oldEndpoint,
    subscription,
    request.headers.get("user-agent"),
  );
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
