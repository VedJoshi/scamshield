import { fraudRadarAnalyzer } from "@/agents/fraud-radar";
import { linkGuardianAnalyzer } from "@/agents/link-guardian";
import { reportSynthAnalyzer } from "@/agents/report-synth";
import { shopScanAnalyzer } from "@/agents/shop-scan";
import { voiceShieldAnalyzer } from "@/agents/voice-shield";
import type { AnalysisInputType, Analyzer } from "@/agents/core/types";

export const analyzerRegistry = [
  linkGuardianAnalyzer,
  voiceShieldAnalyzer,
  shopScanAnalyzer,
  fraudRadarAnalyzer,
  reportSynthAnalyzer,
];

export function getAnalyzerForInput(inputType: AnalysisInputType): Analyzer {
  switch (inputType) {
    case "voice_transcript":
      return voiceShieldAnalyzer;
    case "shop_profile":
      return shopScanAnalyzer;
    case "url":
    case "payment_text":
    case "seller_text":
    case "listing_text":
    case "qr_image":
    case "image_upload":
      return linkGuardianAnalyzer;
    default: {
      const unreachable: never = inputType;
      throw new Error(`No analyzer configured for: ${unreachable}`);
    }
  }
}
