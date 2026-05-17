import { NextResponse } from "next/server";
import OpenAI from "openai";

import { voiceShieldAnalyzer } from "@/agents/voice-shield";

export const runtime = "nodejs";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const locale = (form.get("locale") as string) ?? "vi-VN";
    const resolvedLocale: "vi-VN" | "en-US" =
      locale === "en-US" ? "en-US" : "vi-VN";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 },
      );
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only audio files are supported (MP3, M4A, OGG, WAV, WebM, AAC)." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Audio file must be under 25MB (Whisper API limit)." },
        { status: 400 },
      );
    }

    const client = getClient();

    const audioBytes = await file.arrayBuffer();
    const audioFile = new File([audioBytes], file.name, { type: file.type });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: resolvedLocale === "vi-VN" ? "vi" : "en",
      response_format: "text",
    });

    const transcript = transcription as unknown as string;

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json(
        { error: "Audio was too short or silent to transcribe." },
        { status: 400 },
      );
    }

    const result = await voiceShieldAnalyzer.analyze({
      inputType: "voice_transcript",
      rawInput: transcript,
      locale: resolvedLocale,
    });

    return NextResponse.json({
      transcript,
      ...result,
    });
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      const isProviderError =
        msg.includes("openai") ||
        msg.includes("api key") ||
        msg.includes("rate limit") ||
        msg.includes("quota") ||
        msg.includes("timeout") ||
        msg.includes("whisper") ||
        msg.includes("transcription") ||
        msg.includes("model returned") ||
        msg.includes("empty");

      if (isProviderError) {
        console.error("[ScamShield] Audio provider error:", error.message);
        return NextResponse.json(
          { error: "The analysis service is temporarily unavailable. Please try again in a moment." },
          { status: 502 },
        );
      }
    }

    console.error("[ScamShield] Audio analysis error:", error);
    return NextResponse.json(
      { error: "ScamShield could not analyze this audio. Please try again later." },
      { status: 500 },
    );
  }
}
