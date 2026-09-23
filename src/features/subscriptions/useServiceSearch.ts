import { useEffect, useState } from "react";

import {
  searchDebounceMs,
  searchMinLength,
  searchServices,
  type ServiceSuggestion,
} from "./logos";

export type ServiceSearch = {
  results: ServiceSuggestion[];
  searching: boolean;
};

export function useServiceSearch(query: string, active: boolean): ServiceSearch {
  const [results, setResults] = useState<ServiceSuggestion[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const trimmed = query.trim();
  const eligible = active && trimmed.length >= searchMinLength;

  useEffect(() => {
    if (!eligible) {
      setResults([]);
      setPending(null);
      return;
    }
    setPending(trimmed);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void searchServices(trimmed, controller.signal).then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        setResults(result.ok ? result.data : []);
        setPending((current) => (current === trimmed ? null : current));
      });
    }, searchDebounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, eligible]);

  return { results, searching: eligible && pending !== null };
}
