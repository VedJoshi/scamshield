"use client";

import { useState } from "react";

import type { AnalysisResult } from "@/agents/core/types";

interface ImageAnalysisState {
  isLoading: boolean;
  result: AnalysisResult | null;
  error: string | null;
  preview: string | null;
}

export function useImageAnalysis() {
  const [state, setState] = useState<ImageAnalysisState>({
    isLoading: false,
    result: null,
    error: null,
    preview: null,
  });

  function analyzeImage(file: File, locale: "en-US" | "vi-VN") {
    const preview = URL.createObjectURL(file);

    setState({
      isLoading: true,
      result: null,
      error: null,
      preview,
    });

    const form = new FormData();
    form.append("file", file);
    form.append("locale", locale);

    fetch("/api/analyze-image", {
      method: "POST",
      body: form,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Image analysis failed.");
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          result: payload,
        }));
      })
      .catch((caught) => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: caught instanceof Error ? caught.message : "Image analysis failed.",
        }));
      });
  }

  function cleanup() {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({
      isLoading: false,
      result: null,
      error: null,
      preview: null,
    });
  }

  return {
    analyzeImage,
    cleanup,
    ...state,
  };
}
