"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AudioAnalysisResult } from "@/features/analysis/types";
import { useAudioAnalysis } from "@/features/analysis/hooks/useAudioAnalysis";

interface AudioUploaderProps {
  locale: "en-US" | "vi-VN";
  onResult: (result: AudioAnalysisResult) => void;
  onError: (msg: string) => void;
  queuedFile?: {
    id: string;
    file: File;
  } | null;
}

const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
];
const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".m4a", ".ogg", ".wav", ".webm", ".aac", ".mp4"];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function isAllowedAudioFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    ALLOWED_AUDIO_TYPES.includes(file.type) ||
    ALLOWED_AUDIO_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  );
}

export function AudioUploader({ locale, onResult, onError, queuedFile }: AudioUploaderProps) {
  const { analyzeAudio, reset, isLoading, result, error, transcribingStage, analyzingStage } =
    useAudioAnalysis();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const durationUrlRef = useRef<string | null>(null);
  const handledQueuedFileIdRef = useRef<string | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  useEffect(() => {
    if (result) {
      onResultRef.current(result);
    }
  }, [result]);

  useEffect(() => {
    if (error) {
      onErrorRef.current(error);
    }
  }, [error]);

  const clearDurationUrl = useCallback((objectUrl = durationUrlRef.current) => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    if (durationUrlRef.current === objectUrl) {
      durationUrlRef.current = null;
    }
  }, []);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) {
      return false;
    }

    if (!isAllowedAudioFile(file)) {
      reset();
      setSelectedFile(null);
      setDuration(null);
      clearDurationUrl();
      onErrorRef.current("Please choose an audio file (MP3, M4A, OGG, WAV, WebM, AAC).");
      return false;
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      reset();
      setSelectedFile(null);
      setDuration(null);
      clearDurationUrl();
      onErrorRef.current("Audio file must be under 25MB.");
      return false;
    }

    onErrorRef.current("");
    reset();
    setSelectedFile(file);
    setDuration(null);
    clearDurationUrl();

    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    durationUrlRef.current = objectUrl;
    audio.src = objectUrl;
    audio.addEventListener("loadedmetadata", () => {
      setDuration(formatDuration(audio.duration));
      clearDurationUrl(objectUrl);
    }, { once: true });
    audio.addEventListener("error", () => {
      setDuration(null);
      clearDurationUrl(objectUrl);
    }, { once: true });
    return true;
  }, [clearDurationUrl, reset]);

  useEffect(() => {
    if (queuedFile && queuedFile.id !== handledQueuedFileIdRef.current) {
      handledQueuedFileIdRef.current = queuedFile.id;
      if (handleFile(queuedFile.file)) {
        analyzeAudio(queuedFile.file, locale);
      }
    }
  }, [analyzeAudio, handleFile, locale, queuedFile]);

  useEffect(() => {
    return () => {
      clearDurationUrl();
    };
  }, [clearDurationUrl]);

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
            role="button"
            tabIndex={0}
            aria-label="Upload voice note or call recording for scam analysis"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
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
