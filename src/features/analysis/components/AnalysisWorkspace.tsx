"use client";

import Link from "next/link";
import { useState } from "react";

import type { AnalysisResult } from "@/agents/core/types";
import { AnalyzeForm } from "@/features/analysis/components/AnalyzeForm";
import { AnalysisResultPanel } from "@/features/analysis/components/AnalysisResultPanel";
import { useAnalysis } from "@/features/analysis/hooks/useAnalysis";
import { useCaseHistory } from "@/features/analysis/hooks/useCaseHistory";
import { exampleInputs } from "@/features/analysis/services/example-inputs";
import type { AudioAnalysisResult, SavedCase } from "@/features/analysis/types";

type FormInputType = import("@/agents/core/types").AnalysisInputType | "audio_upload";

export function AnalysisWorkspace() {
  const [inputType, setInputType] = useState<FormInputType>("url");
  const [rawInput, setRawInput] = useState(exampleInputs[0]?.rawInput ?? "");
  const [locale, setLocale] = useState<"vi-VN" | "en-US">("en-US");
  const [lastSavedCaseId, setLastSavedCaseId] = useState<SavedCase["id"] | null>(null);
  const [audioResult, setAudioResult] = useState<AudioAnalysisResult | null>(null);
  const { analyze, error, isLoading, lastRequest, result, setError, setLastRequest, setResult } = useAnalysis();
  const { addCase } = useCaseHistory();

  function handleSave() {
    if (!result || !lastRequest) {
      return;
    }

    const nextCase: SavedCase = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      request: {
        inputType: lastRequest.inputType,
        rawInput: lastRequest.rawInput,
        locale: lastRequest.locale,
      },
      result,
    };

    addCase(nextCase);
    setLastSavedCaseId(nextCase.id);
  }

  function handleImageResult(imageResult: AnalysisResult) {
    setLastSavedCaseId(null);
    setAudioResult(null);
    setError(null);
    setResult(imageResult);
    setLastRequest({
      inputType: "image_upload",
      rawInput: "[image upload]",
      locale,
    });
  }

  function handleImageError(msg: string) {
    setLastSavedCaseId(null);
    setAudioResult(null);
    setError(msg);
    setResult(null);
  }

  function handleAudioResult(aResult: AudioAnalysisResult) {
    setLastSavedCaseId(null);
    setError(null);
    setAudioResult(aResult);
    setResult(aResult);
    setLastRequest({
      inputType: "voice_transcript",
      rawInput: aResult.transcript,
      locale,
    });
  }

  function handleAudioError(msg: string) {
    setLastSavedCaseId(null);
    setAudioResult(null);
    setError(msg);
    setResult(null);
  }

  return (
    <main className="page-shell">
      <section className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">ScamShield MVP</p>
          <h1>Three specialized agents. One anti-scam platform.</h1>
          <p className="hero-lead">
            LinkGuardian checks links and payments. VoiceShield flags suspicious calls
            and messages. ShopScan scores e-commerce seller trust. All Vietnam-focused,
            all AI-backed.
          </p>
          <div className="hero-metrics">
            <article>
              <strong>Works now</strong>
              <span>Three real agents: LinkGuardian, VoiceShield, and ShopScan</span>
            </article>
            <article>
              <strong>Can make money</strong>
              <span>Consumer checks first, trust API and marketplace tooling later</span>
            </article>
          </div>
          <div className="hero-links">
            <Link href="/history">Open case history</Link>
            <Link href="/agents">See platform roadmap</Link>
          </div>
        </div>

        <AnalysisResultPanel
          result={result}
          error={error}
          canSave={Boolean(result) && !lastSavedCaseId}
          onSave={handleSave}
          lastSavedCaseId={lastSavedCaseId}
        />

        {audioResult ? (
          <details className="transcript-toggle">
            <summary>View transcript</summary>
            <p>{audioResult.transcript}</p>
            <p className="transcript-note">Transcribed by Whisper AI — verify before sharing.</p>
          </details>
        ) : null}
      </section>

      <AnalyzeForm
        inputType={inputType}
        rawInput={rawInput}
        locale={locale}
        isLoading={isLoading}
        onInputTypeChange={(value) => {
          setInputType(value);
          setLastSavedCaseId(null);
          setAudioResult(null);
        }}
        onRawInputChange={(value) => {
          setRawInput(value);
          setLastSavedCaseId(null);
          setAudioResult(null);
        }}
        onLocaleChange={(value) => setLocale(value)}
        onSubmit={(request) => {
          setLastSavedCaseId(null);
          setAudioResult(null);
          void analyze(request);
        }}
        examples={exampleInputs}
        onLoadExample={(example) => {
          setInputType(example.inputType);
          setRawInput(example.rawInput);
          setLastSavedCaseId(null);
          setAudioResult(null);
        }}
        onImageResult={handleImageResult}
        onImageError={handleImageError}
        onAudioResult={handleAudioResult}
        onAudioError={handleAudioError}
      />
    </main>
  );
}
