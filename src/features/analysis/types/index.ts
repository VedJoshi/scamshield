export type {
  AnalysisInputType,
  AnalysisRequest,
  AnalysisResult,
  Analyzer,
  RiskLevel,
  ScamSignal,
} from "@/agents/core/types";

import type { AnalysisResult } from "@/agents/core/types";

export interface SavedCase {
  id: string;
  createdAt: string;
  request: import("@/agents/core/types").AnalysisRequest;
  result: AnalysisResult;
}

export interface AudioAnalysisResult extends AnalysisResult {
  transcript: string;
}
