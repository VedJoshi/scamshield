"use client";

import { useEffect, useRef, useState } from "react";

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

  function analyzeAudio(file: File, locale: "en-US" | "vi-VN") {
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
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Audio analysis failed.");
        }

        if (stageTimerRef.current) {
          clearTimeout(stageTimerRef.current);
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
        if (stageTimerRef.current) {
          clearTimeout(stageTimerRef.current);
        }

        setState({
          isLoading: false,
          result: null,
          error: caught instanceof Error ? caught.message : "Audio analysis failed.",
          transcribingStage: false,
          analyzingStage: false,
        });
      });
  }

  function reset() {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
    }
    setState({
      isLoading: false,
      result: null,
      error: null,
      transcribingStage: false,
      analyzingStage: false,
    });
  }

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
      }
    };
  }, []);

  return {
    analyzeAudio,
    reset,
    ...state,
  };
}
