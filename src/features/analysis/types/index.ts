import type { AnalysisInputType, AnalysisRequest, AnalysisResult } from "@/agents/core/types";

export type {
  AnalysisInputType,
  AnalysisRequest,
  AnalysisResult,
  Analyzer,
  RiskLevel,
  ScamSignal,
} from "@/agents/core/types";

export type FormInputType = AnalysisInputType | "audio_upload";

export interface QueuedUpload {
  id: string;
  kind: "image" | "audio";
  file: File;
}

export interface SavedCase {
  id: string;
  createdAt: string;
  request: AnalysisRequest;
  result: AnalysisResult;
}

export interface AudioAnalysisResult extends AnalysisResult {
  transcript: string;
}
