import { isValidServiceKey } from "@/lib/logos";
import { dataFailure, dataSuccess, supabase, type DataResult } from "@/lib/supabase";

export type ServiceSuggestion = {
  name: string;
  domain: string;
};

export const searchDebounceMs = 150;
export const searchMinLength = 2;

function isSuggestion(value: unknown): value is ServiceSuggestion {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "domain" in value &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    isValidServiceKey(value.domain)
  );
}

export async function searchServices(
  query: string,
  signal: AbortSignal,
): Promise<DataResult<ServiceSuggestion[]>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token === undefined) {
      return dataFailure("session");
    }
    const response = await fetch(
      `/api/logos/search?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${token}` }, signal },
    );
    if (!response.ok) {
      return dataFailure("unknown");
    }
    const body: unknown = await response.json();
    const results =
      typeof body === "object" && body !== null && "results" in body
        ? body.results
        : null;
    return dataSuccess(Array.isArray(results) ? results.filter(isSuggestion) : []);
  } catch {
    return dataFailure("network");
  }
}
