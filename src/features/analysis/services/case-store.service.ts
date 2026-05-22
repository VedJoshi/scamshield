"use client";

import type { SavedCase } from "@/features/analysis/types";
import { savedCaseSchema, savedCasesSchema } from "@/features/analysis/schemas/analysis";

const STORAGE_KEY = "scamshield.case-history.v1";

function loadLocalCases(): SavedCase[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return savedCasesSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveLocalCase(nextCase: SavedCase): SavedCase[] {
  const cases = [nextCase, ...loadLocalCases()].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  return cases;
}

export async function loadSavedCases(): Promise<SavedCase[]> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const response = await fetch("/api/cases", { method: "GET" });
    const payload = await response.json();

    if (response.ok && Array.isArray(payload.cases) && payload.storage === "supabase") {
      return savedCasesSchema.parse(payload.cases);
    }
  } catch {
    // Keep the MVP usable if Supabase is not configured locally.
  }

  return loadLocalCases();
}

export async function saveCase(nextCase: SavedCase): Promise<SavedCase[]> {
  try {
    const response = await fetch("/api/cases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextCase),
    });
    const payload = await response.json();

    if (response.ok && payload.case && payload.storage === "supabase") {
      return [savedCaseSchema.parse(payload.case), ...(await loadSavedCases()).filter((entry) => entry.id !== nextCase.id)];
    }
  } catch {
    // Keep the MVP usable if Supabase is not configured locally.
  }

  return saveLocalCase(nextCase);
}
