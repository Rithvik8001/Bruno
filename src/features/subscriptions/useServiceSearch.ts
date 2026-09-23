import { useEffect, useState } from "react";

import {
  searchDebounceMs,
  searchMinLength,
  searchServices,
  type ServiceSuggestion,
} from "./logos";

export function useServiceSearch(
  query: string,
  active: boolean,
): { results: ServiceSuggestion[] } {
  const [results, setResults] = useState<ServiceSuggestion[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    if (!active || trimmed.length < searchMinLength) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchServices(trimmed, controller.signal).then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        if (result.ok) {
          setResults(result.data);
        }
      });
    }, searchDebounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, active]);

  return { results };
}
