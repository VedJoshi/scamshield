"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  const abortRef = useRef<AbortController | null>(null);
  const previewRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const dispose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    revokePreview();
  }, [revokePreview]);

  const cleanup = useCallback(() => {
    dispose();
    setState({
      isLoading: false,
      result: null,
      error: null,
      preview: null,
    });
  }, [dispose]);

  const analyzeImage = useCallback((file: File, locale: "en-US" | "vi-VN") => {
    abortRef.current?.abort();
    abortRef.current = null;
    revokePreview();

    const preview = URL.createObjectURL(file);
    const controller = new AbortController();
    previewRef.current = preview;
    abortRef.current = controller;

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
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Image analysis failed.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          result: payload,
        }));
      })
      .catch((caught) => {
        if (controller.signal.aborted) {
          return;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: caught instanceof Error ? caught.message : "Image analysis failed.",
        }));
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  }, [revokePreview]);

  useEffect(() => dispose, [dispose]);

  return {
    analyzeImage,
    cleanup,
    ...state,
  };
}
