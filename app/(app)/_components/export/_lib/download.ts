import type { ActionError } from "@/lib/actions/errors";
import { routes } from "@/lib/auth/rules";
import { EXPORT_HEADERS, type ExportRequest } from "@/lib/export/rules";

export interface ExportedFile {
  readonly name: string;
  readonly rows: number;
  readonly files: number;
  readonly blob: Blob;
}

export type ExportOutcome =
  | { readonly kind: "ready"; readonly file: ExportedFile }
  | { readonly kind: "refused"; readonly error: ActionError }
  | { readonly kind: "failed" }
  | { readonly kind: "aborted" };

const REVOKE_AFTER_MS = 60_000;
const FALLBACK_NAME = "bruno-export";

function parseRefusal(value: unknown): ActionError | null {
  if (typeof value !== "object" || value === null || !("error" in value)) return null;
  const error = (value as { error: unknown }).error;
  return typeof error === "object" && error !== null && "code" in error && "message" in error ? (error as ActionError) : null;
}

const headerCount = (response: Response, name: string) => {
  const value = Number(response.headers.get(name));
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
};

export async function requestExport(input: ExportRequest, signal: AbortSignal): Promise<ExportOutcome> {
  try {
    const response = await fetch(routes.exportApi, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    if (!response.ok) {
      const refusal = parseRefusal(await response.json().catch(() => null));
      return refusal ? { kind: "refused", error: refusal } : { kind: "failed" };
    }
    const blob = await response.blob();
    return {
      kind: "ready",
      file: {
        name: response.headers.get(EXPORT_HEADERS.name) ?? FALLBACK_NAME,
        rows: headerCount(response, EXPORT_HEADERS.rows),
        files: Math.max(1, headerCount(response, EXPORT_HEADERS.files)),
        blob,
      },
    };
  } catch {
    return signal.aborted ? { kind: "aborted" } : { kind: "failed" };
  }
}

export function saveFile(file: ExportedFile): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
