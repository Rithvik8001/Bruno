"use client";

import { useEffect } from "react";
import { markActivitySeen } from "@/lib/feed/actions";

export function SeenMarker() {
  useEffect(() => {
    void markActivitySeen({});
  }, []);
  return null;
}
