import type { AnalysisRequest, AnalysisResult, Analyzer } from "@/agents/core/types";

async function notReady(_: AnalysisRequest): Promise<AnalysisResult> {
  throw new Error("FraudRadar is not enabled in the MVP.");
}

export const fraudRadarAnalyzer: Analyzer = {
  id: "fraud-radar",
  name: "FraudRadar",
  description: "Aggregates scam patterns across analyzed cases. Supabase-backed stats are queued for the dashboard phase.",
  supportedInputs: [],
  enabled: false,
  monetizationAngle: "Team dashboard and institutional intelligence subscriptions.",
  analyze: notReady,
};
