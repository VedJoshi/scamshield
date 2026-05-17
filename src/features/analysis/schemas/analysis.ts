import { z } from "zod";

export const analysisInputTypeSchema = z.enum([
  "url",
  "payment_text",
  "seller_text",
  "listing_text",
  "voice_transcript",
  "shop_profile",
  "qr_image",
  "image_upload",
]);

export const analysisRequestSchema = z
  .object({
    inputType: analysisInputTypeSchema,
    rawInput: z.string().trim(),
    locale: z.enum(["vi-VN", "en-US"]),
  })
  .superRefine((data, ctx) => {
    if (data.inputType === "image_upload") {
      if (data.rawInput.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          path: ["rawInput"],
          message: "Image data is too small.",
        });
      }
      if (data.rawInput.length > 500000) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: 500000,
          type: "string",
          inclusive: true,
          path: ["rawInput"],
          message: "Image data exceeds 500KB limit.",
        });
      }
    } else {
      if (data.rawInput.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 8,
          type: "string",
          inclusive: true,
          path: ["rawInput"],
          message: "Input must be at least 8 characters.",
        });
      }
      if (data.rawInput.length > 6000) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: 6000,
          type: "string",
          inclusive: true,
          path: ["rawInput"],
          message: "Input must be under 6000 characters.",
        });
      }
    }
  });

export const scamSignalSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.string().min(1),
});

export const aiAnalysisResponseSchema = z.object({
  signals: z.array(scamSignalSchema).min(1).max(8),
  reasons: z.array(z.string().min(1)).min(1).max(5),
  recommendedAction: z.string().min(1).max(300),
  shortReport: z.string().min(1).max(500),
});

export const analysisResultSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high"]),
  signals: z.array(scamSignalSchema),
  reasons: z.array(z.string().min(1)),
  recommendedAction: z.string().min(1),
  shortReport: z.string().min(1),
});

export const savedCaseSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  request: analysisRequestSchema,
  result: analysisResultSchema,
});

export const savedCasesSchema = z.array(savedCaseSchema);

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
export type AnalysisResultInput = z.infer<typeof analysisResultSchema>;
