export type AnalysisInputType =
  | "url"
  | "payment_text"
  | "seller_text"
  | "listing_text"
  | "voice_transcript"
  | "shop_profile"
  | "qr_image"
  | "image_upload";

export type RiskLevel = "low" | "medium" | "high";

export interface AnalysisRequest {
  inputType: AnalysisInputType;
  rawInput: string;
  locale: "vi-VN" | "en-US";
}

export interface ScamSignal {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  evidence: string;
}

export interface AnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  signals: ScamSignal[];
  reasons: string[];
  recommendedAction: string;
  shortReport: string;
}

export interface Analyzer {
  id: string;
  name: string;
  description: string;
  supportedInputs: AnalysisInputType[];
  enabled: boolean;
  monetizationAngle: string;
  analyze(input: AnalysisRequest): Promise<AnalysisResult>;
}
