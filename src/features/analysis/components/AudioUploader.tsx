"use client";

import { useEffect, useRef, useState } from "react";

import type { AudioAnalysisResult } from "@/features/analysis/types";
import { useAudioAnalysis } from "@/features/analysis/hooks/useAudioAnalysis";

interface AudioUploaderProps {
  locale: "en-US" | "vi-VN";
  onResult: (result: AudioAnalysisResult) => void;
  onError: (msg: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioUploader({ locale, onResult, onError }: AudioUploaderProps) {
  const { analyzeAudio, reset, isLoading, result, error, transcribingStage, analyzingStage } =
    useAudioAnalysis();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (result) {
      onResult(result);
    }
  }, [result, onResult]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    onError("");
    reset();
    setSelectedFile(file);

    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.addEventListener("loadedmetadata", () => {
      setDuration(formatDuration(audio.duration));
      URL.revokeObjectURL(objectUrl);
    });
    audio.addEventListener("error", () => {
      setDuration(null);
      URL.revokeObjectURL(objectUrl);
    });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) {
      handleFile(file);
    } else {
      onError("Please drop an audio file (MP3, M4A, OGG, WAV, WebM).");
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return (
    <div className="audio-uploader">
      {!isLoading && !result ? (
        <>
          <div
            className="audio-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <span>Drop a voice note or call recording here, or click to upload</span>
            <small>WhatsApp voice notes · Call recordings · MP3 · M4A · OGG · WAV</small>
          </div>
          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept="audio/*"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {selectedFile && !isLoading ? (
            <div className="audio-file-info">
              <div className="audio-file-details">
                <strong>{selectedFile.name}</strong>
                {duration ? <span>{duration}</span> : null}
                <span>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => analyzeAudio(selectedFile, locale)}
              >
                Transcribe &amp; analyze
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {isLoading ? (
        <div className="audio-loading">
          <div className="waveform-bars">
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
            <div className="waveform-bar" />
          </div>
          <p>{transcribingStage ? "Transcribing audio..." : "Analyzing transcript..."}</p>
        </div>
      ) : null}
    </div>
  );
}
