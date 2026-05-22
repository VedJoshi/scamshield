"use client";

import { useEffect, useState } from "react";

import { loadSavedCases, saveCase } from "@/features/analysis/services/case-store.service";
import type { SavedCase } from "@/features/analysis/types";

export function useCaseHistory() {
  const [cases, setCases] = useState<SavedCase[]>([]);

  useEffect(() => {
    void loadSavedCases().then(setCases);
  }, []);

  function addCase(nextCase: SavedCase) {
    setCases((current) => [nextCase, ...current.filter((entry) => entry.id !== nextCase.id)].slice(0, 50));
    void saveCase(nextCase).then(setCases);
  }

  return {
    cases,
    addCase,
  };
}
