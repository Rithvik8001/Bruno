export const actionErrors = {
  invalid: "Check the highlighted fields.",
  unauthorized: "Sign in to keep going.",
  forbidden: "You don't have permission to do that.",
  notFound: "We couldn't find that.",
  conflict: "That can't be done right now.",
  rateLimited: "That's a lot at once. Give it a minute and try again.",
  unknown: "Something went wrong. Please try again.",
} as const;

export type ActionErrorCode = keyof typeof actionErrors;

export interface ActionError {
  readonly code: ActionErrorCode;
  readonly message: string;
  readonly fields?: Readonly<Record<string, string>>;
  readonly retryAfter?: number;
}

export type ActionResult<T> = { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: ActionError };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionInvalid(
  fields: Readonly<Record<string, string>>,
  message: string = actionErrors.invalid,
): ActionResult<never> {
  return { ok: false, error: { code: "invalid", message, fields } };
}

export function actionFail(code: ActionErrorCode, message: string = actionErrors[code]): ActionResult<never> {
  return { ok: false, error: { code, message } };
}

export function actionRateLimited(retryAfter: number, message: string = actionErrors.rateLimited): ActionResult<never> {
  return { ok: false, error: { code: "rateLimited", message, retryAfter } };
}
