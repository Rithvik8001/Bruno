export type DataFailure =
  | "network"
  | "session"
  | "invalid"
  | "limitReached"
  | "profileMissing"
  | "unknown";

export type DataResult<T, F extends string = DataFailure> =
  | { ok: true; data: T }
  | { ok: false; reason: F };

export const limitReachedCode = "BR001";
export const profileMissingCode = "BR002";

const unauthorizedStatus = 401;
const sessionCodes = ["PGRST301", "PGRST303"];
const invalidCodes = ["23514", "23502", "22001", "22P02", "22007"];

export function dataSuccess<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

export function dataFailure<T>(reason: DataFailure): DataResult<T> {
  return { ok: false, reason };
}

export function mapDataFailure(
  error: { code?: string } | null,
  status: number,
): DataFailure {
  const code = error?.code;

  if (code === limitReachedCode) {
    return "limitReached";
  }
  if (code === profileMissingCode) {
    return "profileMissing";
  }
  if (code !== undefined && invalidCodes.includes(code)) {
    return "invalid";
  }
  if (
    status === unauthorizedStatus ||
    (code !== undefined && sessionCodes.includes(code))
  ) {
    return "session";
  }
  if (status === 0) {
    return "network";
  }
  return "unknown";
}
