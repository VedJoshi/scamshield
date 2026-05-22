"use client";

import { useCallback, useEffect, useRef } from "react";

import type { AnalysisResult } from "@/agents/core/types";
import { useImageAnalysis } from "@/features/analysis/hooks/useImageAnalysis";

interface ImageUploaderProps {
  locale: "en-US" | "vi-VN";
  onResult: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
  queuedFile?: {
    id: string;
    file: File;
  } | null;
}

const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageUploader({ locale, onResult, onError, queuedFile }: ImageUploaderProps) {
  const { analyzeImage, cleanup, isLoading, result, error, preview } = useImageAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) {
      return false;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      cleanup();
      onErrorRef.current("Please choose an image file (PNG, JPEG, WebP, GIF).");
      return false;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      cleanup();
      onErrorRef.current("Image must be under 8MB.");
      return false;
    }

    onErrorRef.current("");
    analyzeImage(file, locale);
    return true;
  }, [analyzeImage, cleanup, locale]);

  useEffect(() => {
    if (queuedFile && queuedFile.id !== handledQueuedFileIdRef.current) {
      handledQueuedFileIdRef.current = queuedFile.id;
      handleFile(queuedFile.file);
    }
  }, [handleFile, queuedFile]);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    } else {
      onError("Please drop an image file (PNG, JPEG, WebP, GIF).");
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  return (
    <div className="image-uploader">
      <div
        className="image-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload screenshot for scam analysis"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <span>Drop a screenshot here, or click to upload</span>
        <small>WhatsApp message · Bank SMS · Shopee listing · Payment page</small>
      </div>
      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {preview && !isLoading && !result ? (
        <div className="image-preview-shell">
          <img src={preview} alt="Preview" className="image-preview" />
          <button
            className="primary-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose a different image
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="image-loading">
          {preview ? <img src={preview} alt="Preview" className="image-preview" /> : null}
          <div className="spinner" />
          <p>Reading image and analyzing for scam signals...</p>
        </div>
      ) : null}
    </div>
  );
}
