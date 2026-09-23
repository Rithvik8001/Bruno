import { useState } from "react";

import type { ScreenRefresh } from "@/design";
import type { DataFailure, DataResult } from "@/lib/supabase";

export function usePullToRefresh(
  refresh: () => Promise<DataResult<void>>,
  onFailure: (reason: DataFailure) => void,
): ScreenRefresh {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    void refresh().then((result) => {
      setRefreshing(false);
      if (!result.ok) {
        onFailure(result.reason);
      }
    });
  };

  return { refreshing, onRefresh };
}
