"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AudioAnalysisResult } from "@/features/analysis/types";

interface AudioAnalysisState {
  isLoading: boolean;
  result: AudioAnalysisResult | null;
  error: string | null;
  transcribingStage: boolean;
  analyzingStage: boolean;
}

export function useAudioAnalysis() {
  const [state, setState] = useState<AudioAnalysisState>({
    isLoading: false,
    result: null,
    error: null,
    transcribingStage: false,
    analyzingStage: false,
  });

  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const dispose = useCallback(() => {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }

    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    dispose();
    setState({
      isLoading: false,
      result: null,
      error: null,
      transcribingStage: false,
      analyzingStage: false,
    });
  }, [dispose]);

  const analyzeAudio = useCallback((file: File, locale: "en-US" | "vi-VN") => {
    reset();

    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      isLoading: true,
      result: null,
      error: null,
      transcribingStage: true,
      analyzingStage: false,
    });

    stageTimerRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        transcribingStage: false,
        analyzingStage: true,
      }));
    }, 3000);

    const form = new FormData();
    form.append("file", file);
    form.append("locale", locale);

    fetch("/api/analyze-audio", {
      method: "POST",
      body: form,
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Audio analysis failed.");
        }

        if (controller.signal.aborted) {
          return;
        }

        if (stageTimerRef.current) {
          clearTimeout(stageTimerRef.current);
          stageTimerRef.current = null;
        }

        setState({
          isLoading: false,
          result: payload,
          error: null,
          transcribingStage: false,
          analyzingStage: false,
        });
      })
      .catch((caught) => {
        if (controller.signal.aborted) {
          return;
        }

        if (stageTimerRef.current) {
          clearTimeout(stageTimerRef.current);
          stageTimerRef.current = null;
        }

        setState({
          isLoading: false,
          result: null,
          error: caught instanceof Error ? caught.message : "Audio analysis failed.",
          transcribingStage: false,
          analyzingStage: false,
        });
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  }, [reset]);

  useEffect(() => {
    return dispose;
  }, [dispose]);

  return {
    analyzeAudio,
    reset,
    ...state,
  };
}
