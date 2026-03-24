"use client";

import { useEffect } from "react";

import { useFlowStore } from "@/lib/store";

export function FlowHydration() {
  const hydrateFromStorage = useFlowStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
}
