import { NextResponse } from "next/server";
import OpenAI from "openai";

import { aiAnalysisResponseSchema } from "@/features/analysis/schemas/analysis";
import { computeRisk } from "@/features/analysis/services/scoring.service";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const VISION_SYSTEM_PROMPT = `You are ScamShield's visual analyst for Vietnam.

You will receive a screenshot or photo. First, describe what you see in the image (what app or platform is shown, what the message or content says). Then analyze for scam signals: impersonation, urgency, suspicious domains, off-platform payments, unrealistic pricing, identity ambiguity.

Rules:
- Return concise, concrete scam-risk signals, not legal conclusions.
- Focus on signs such as impersonation, urgency, off-platform payments, suspicious domains, unrealistic pricing, unverifiable seller identity, and payment diversion.
- Keep evidence tied directly to what is visible in the image.
- Write for end users, not investigators.
- If the content seems safe, still provide a cautious low-risk assessment with minimal signals.
- The shortReport should begin with one sentence describing what the image shows (e.g. "This appears to be a WhatsApp message impersonating Vietcombank.") before the risk assessment.
- Output valid JSON only.`;

function buildVisionUserPrompt(locale: string) {
  return `Analyze this image for scam risk for a user in Vietnam.
Locale: ${locale}
Return JSON with signals, reasons, recommendedAction, and shortReport.`;
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const rateLimitResponse = checkRateLimit(request, {
      keyPrefix: "analyze-image",
      limit: 10,
      windowMs: 60_000,
      message: "Rate limit exceeded. Max 10 image analyses per minute.",
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const locale = (form.get("locale") as string) ?? "en-US";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are supported (PNG, JPEG, WebP, GIF)." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 8MB." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const client = getClient();
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: buildVisionUserPrompt(locale) },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "scam_analysis",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              signals: {
                type: "array",
                minItems: 1,
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    evidence: { type: "string" },
                  },
                  required: ["id", "label", "severity", "evidence"],
                },
              },
              reasons: {
                type: "array",
                minItems: 1,
                maxItems: 5,
                items: { type: "string" },
              },
              recommendedAction: { type: "string" },
              shortReport: { type: "string" },
            },
            required: ["signals", "reasons", "recommendedAction", "shortReport"],
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("The model returned an empty analysis.");
    }

    const parsed = aiAnalysisResponseSchema.parse(JSON.parse(content));
    const risk = computeRisk(parsed.signals);

    return NextResponse.json({
      ...parsed,
      ...risk,
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
        msg.includes("model returned") ||
        msg.includes("empty");

      if (isProviderError) {
        console.error("[ScamShield] Vision provider error:", error.message);
        return NextResponse.json(
          { error: "The analysis service is temporarily unavailable. Please try again in a moment." },
          { status: 502 },
        );
      }
    }

    console.error("[ScamShield] Vision analysis error:", error);
    return NextResponse.json(
      { error: "ScamShield could not analyze this image. Please try again later." },
      { status: 500 },
    );
  }
}
