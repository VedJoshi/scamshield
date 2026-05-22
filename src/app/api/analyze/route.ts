import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { analyzeScamContent } from "@/features/analysis/services/analysis.service";
import { analysisRequestSchema } from "@/features/analysis/schemas/analysis";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function isProviderError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("openai") ||
      msg.includes("api key") ||
      msg.includes("rate limit") ||
      msg.includes("quota") ||
      msg.includes("timeout") ||
      msg.includes("econnrefused") ||
      msg.includes("enotfound") ||
      msg.includes("model returned") ||
      msg.includes("empty")
    );
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const rateLimitResponse = checkRateLimit(request, {
      keyPrefix: "analyze",
      limit: 20,
      windowMs: 60_000,
      message: "Rate limit exceeded. Max 20 analyses per minute.",
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const parsed = analysisRequestSchema.parse(body);
    const result = await analyzeScamContent(parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error("[ScamShield] Validation error:", error.flatten());
      return NextResponse.json(
        { error: "Invalid analysis input. Please submit a longer URL or text sample." },
        { status: 400 },
      );
    }

    if (isProviderError(error)) {
      console.error("[ScamShield] Provider error:", error instanceof Error ? error.message : error);
      return NextResponse.json(
        { error: "The analysis service is temporarily unavailable. Please try again in a moment." },
        { status: 502 },
      );
    }

    console.error("[ScamShield] Internal error:", error);
    return NextResponse.json(
      { error: "ScamShield could not analyze this input. Please try again later." },
      { status: 500 },
    );
  }
}
