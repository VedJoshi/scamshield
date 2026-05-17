"use client";

import { useEffect, useRef } from "react";

import type { AnalysisResult } from "@/agents/core/types";
import { useImageAnalysis } from "@/features/analysis/hooks/useImageAnalysis";

interface ImageUploaderProps {
  locale: "en-US" | "vi-VN";
  onResult: (result: AnalysisResult) => void;
  onError: (msg: string) => void;
}

export function ImageUploader({ locale, onResult, onError }: ImageUploaderProps) {
  const { analyzeImage, cleanup, isLoading, result, error, preview } = useImageAnalysis();
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

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    onError("");
    analyzeImage(file, locale);
  }

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
