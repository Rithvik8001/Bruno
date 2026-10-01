export interface DeviceInfo {
  readonly browser: string;
  readonly os: string;
  readonly label: string;
}

const BROWSERS = [
  [/Edg(A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
] as const satisfies readonly (readonly [RegExp, string])[];

const SYSTEMS = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/CrOS/, "Chromebook"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/Windows/, "Windows"],
  [/Linux/, "Linux"],
] as const satisfies readonly (readonly [RegExp, string])[];

const UNKNOWN_BROWSER = "A browser";
const UNKNOWN_OS = "a new device";

function match(table: readonly (readonly [RegExp, string])[], value: string): string | null {
  return table.find(([pattern]) => pattern.test(value))?.[1] ?? null;
}

export function describeDevice(userAgent: string | null): DeviceInfo {
  const agent = userAgent ?? "";
  const browser = match(BROWSERS, agent) ?? UNKNOWN_BROWSER;
  const os = match(SYSTEMS, agent) ?? UNKNOWN_OS;
  return { browser, os, label: `${browser} on ${os}` };
}
