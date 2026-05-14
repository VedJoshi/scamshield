import OpenAI from "openai";

import type { AnalysisRequest, AnalysisResult, Analyzer } from "@/agents/core/types";
import { aiAnalysisResponseSchema } from "@/features/analysis/schemas/analysis";
import { computeRisk } from "@/features/analysis/services/scoring.service";

const SYSTEM_PROMPT = `You are VoiceShield, ScamShield's phone and message scam analyst for Vietnam.
Assess pasted SMS, WhatsApp messages, and phone call transcripts.

Rules:
- Return concise, concrete scam-risk signals, not legal conclusions.
- Focus on impersonation of Vietcombank, MoMo, ZaloPay, government agencies, police, courts, tax offices, and delivery companies.
- Pay special attention to urgency, OTP requests, password or PIN requests, prize or lottery fraud, fake delivery notifications, and requests to transfer money to a "safe account".
- Keep evidence tied directly to the submitted content.
- Write for end users, not investigators.
- If the content seems safe, still provide a cautious low-risk assessment with minimal signals.
- Output valid JSON only.`;

function buildUserPrompt(input: AnalysisRequest) {
  return `Analyze the following suspicious call, SMS, or chat content for a user in Vietnam.

Input type: ${input.inputType}
Locale: ${input.locale}

Return JSON with:
- signals: array of 1-8 items, each with id, label, severity (low|medium|high), evidence
- reasons: array of 1-5 concise bullet-style sentences
- recommendedAction: one short action recommendation
- shortReport: one short paragraph summary

Content:
"""${input.rawInput}"""`;
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return new OpenAI({ apiKey });
}

async function analyze(input: AnalysisRequest): Promise<AnalysisResult> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
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

  return {
    ...parsed,
    ...risk,
  };
}

export const voiceShieldAnalyzer: Analyzer = {
  id: "voice-shield",
  name: "VoiceShield",
  description: "Flags phone, SMS, and chat scam patterns in pasted transcripts.",
  supportedInputs: ["voice_transcript"],
  enabled: true,
  monetizationAngle: "Premium phone assistant and telco partnership workflow.",
  analyze,
};
