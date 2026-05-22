"use client";

import { startTransition, useState } from "react";

import type { AnalysisRequest, AnalysisResult } from "@/agents/core/types";

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [lastRequest, setLastRequest] = useState<AnalysisRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function analyze(input: AnalysisRequest) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLastRequest(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      startTransition(() => {
        setResult(payload);
        setLastRequest(input);
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    analyze,
    error,
    isLoading,
    lastRequest,
    result,
    setError,
    setLastRequest,
    setResult,
  };
}
