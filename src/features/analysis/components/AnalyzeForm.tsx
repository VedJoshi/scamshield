"use client";

import { useState } from "react";

import type { AnalysisInputType, AnalysisRequest, AnalysisResult } from "@/agents/core/types";
import { AudioUploader } from "@/features/analysis/components/AudioUploader";
import { ImageUploader } from "@/features/analysis/components/ImageUploader";
import { QrUploader } from "@/features/analysis/components/QrUploader";
import type { AudioAnalysisResult, FormInputType, QueuedUpload } from "@/features/analysis/types";
import type { ExampleInput } from "@/features/analysis/services/example-inputs";

const inputTypeLabels: Record<AnalysisInputType, string> = {
  url: "URL",
  payment_text: "Payment text",
  seller_text: "Seller text",
  listing_text: "Listing text",
  voice_transcript: "Voice / SMS",
  shop_profile: "Shop profile",
  qr_image: "QR Code",
  image_upload: "Screenshot",
};

const allInputTypes: FormInputType[] = [
  "url",
  "payment_text",
  "seller_text",
  "listing_text",
  "voice_transcript",
  "shop_profile",
  "qr_image",
  "image_upload",
  "audio_upload",
];

const allInputLabels: Record<FormInputType, string> = {
  ...inputTypeLabels,
  audio_upload: "Voice Note",
};

interface AnalyzeFormProps {
  inputType: FormInputType;
  rawInput: string;
  locale: "vi-VN" | "en-US";
  isLoading: boolean;
  onInputTypeChange: (value: FormInputType) => void;
  onRawInputChange: (value: string) => void;
  onLocaleChange: (value: "vi-VN" | "en-US") => void;
  onSubmit: (value: AnalysisRequest) => void;
  examples: ExampleInput[];
  onLoadExample: (example: ExampleInput) => void;
  onImageResult: (result: AnalysisResult) => void;
  onImageError: (msg: string) => void;
  onAudioResult: (result: AudioAnalysisResult) => void;
  onAudioError: (msg: string) => void;
  queuedUpload: QueuedUpload | null;
}

export function AnalyzeForm({
  inputType,
  rawInput,
  locale,
  isLoading,
  onInputTypeChange,
  onRawInputChange,
  onLocaleChange,
  onSubmit,
  examples,
  onLoadExample,
  onImageResult,
  onImageError,
  onAudioResult,
  onAudioError,
  queuedUpload,
}: AnalyzeFormProps) {
  const isUrl = inputType === "url";
  const isQrImage = inputType === "qr_image";
  const isImageUpload = inputType === "image_upload";
  const isAudioUpload = inputType === "audio_upload";
  const [qrError, setQrError] = useState("");

  return (
    <section className="panel panel-strong">
      <div className="section-heading">
        <p className="eyebrow">Live MVP</p>
        <h2>Check a suspicious link or payment request before you pay.</h2>
        <p>
          Drop a screenshot or voice note anywhere - or pick an input type below.
        </p>
      </div>

      <div className="chip-row" role="tablist" aria-label="Input type">
        {allInputTypes.map((value) => (
          <button
            key={value}
            type="button"
            className={`chip ${value === inputType ? "chip-active" : ""}`}
            onClick={() => {
              setQrError("");
              onInputTypeChange(value);

              if (value === "qr_image" || value === "image_upload" || value === "audio_upload") {
                onRawInputChange("");
              }
            }}
          >
            {allInputLabels[value]}
          </button>
        ))}
      </div>

      <div className="locale-row">
        <label htmlFor="locale">Analysis language</label>
        <select
          id="locale"
          value={locale}
          onChange={(event) => onLocaleChange(event.target.value as "vi-VN" | "en-US")}
        >
          <option value="en-US">English</option>
          <option value="vi-VN">Vietnamese</option>
        </select>
      </div>

      <form
        className="analyze-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (inputType !== "audio_upload") {
            onSubmit({ inputType: inputType as AnalysisInputType, rawInput, locale });
          }
        }}
      >
        {isAudioUpload ? (
          <>
            <label className="field-label">
              Upload a voice note or call recording
            </label>
            <AudioUploader
              locale={locale}
              onResult={onAudioResult}
              onError={onAudioError}
              queuedFile={queuedUpload?.kind === "audio" ? queuedUpload : null}
            />
          </>
        ) : isImageUpload ? (
          <>
            <label className="field-label">
              Upload a screenshot or image
            </label>
            <ImageUploader
              locale={locale}
              onResult={onImageResult}
              onError={onImageError}
              queuedFile={queuedUpload?.kind === "image" ? queuedUpload : null}
            />
          </>
        ) : isQrImage ? (
          <>
            <label className="field-label" htmlFor="rawInput">
              {getFieldLabel(inputType, isUrl)}
            </label>
            <QrUploader
              onDecoded={(url) => {
                setQrError("");
                onRawInputChange(url);
              }}
              onError={(message) => {
                setQrError(message);
                onRawInputChange("");
              }}
            />
            {qrError ? <p className="inline-error">{qrError}</p> : null}
            <button className="primary-button" type="submit" disabled={isLoading || rawInput.trim().length < 8}>
              {isLoading ? "Analyzing..." : "Analyze risk"}
            </button>
          </>
        ) : (
          <>
            <label className="field-label" htmlFor="rawInput">
              {getFieldLabel(inputType, isUrl)}
            </label>
            <textarea
              id="rawInput"
              value={rawInput}
              onChange={(event) => onRawInputChange(event.target.value)}
              placeholder={getPlaceholder(inputType)}
              rows={getRows(inputType)}
            />
            <button className="primary-button" type="submit" disabled={isLoading || rawInput.trim().length < 8}>
              {isLoading ? "Analyzing..." : "Analyze risk"}
            </button>
          </>
        )}
      </form>

      <div className="examples-grid">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            className="example-card"
            onClick={() => onLoadExample(example)}
          >
            <span>{example.title}</span>
            <small>{example.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function getPlaceholder(inputType: AnalysisInputType) {
  switch (inputType) {
    case "url":
      return "https://example-login-secure-check.com";
    case "voice_transcript":
      return "Paste a suspicious SMS, WhatsApp message, or call transcript here.";
    case "shop_profile":
      return "Paste a Shopee/TikTok Shop/Lazada seller profile URL or copy-paste the seller page text.";
    case "qr_image":
    case "image_upload":
      return "";
    default:
      return "Paste seller text, listing details, or payment-page instructions here.";
  }
}

function getFieldLabel(inputType: AnalysisInputType, isUrl: boolean) {
  if (isUrl) {
    return "Paste the suspicious URL";
  }

  if (inputType === "qr_image") {
    return "Upload the QR code";
  }

  if (inputType === "image_upload") {
    return "Upload a screenshot or image";
  }

  return `Paste the ${inputTypeLabels[inputType].toLowerCase()}`;
}

function getRows(inputType: AnalysisInputType) {
  if (inputType === "url") {
    return 4;
  }

  if (inputType === "voice_transcript") {
    return 12;
  }

  return 10;
}
