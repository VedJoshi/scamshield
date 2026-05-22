import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";

interface CaseAnalyticsRow {
  id: string;
  created_at: string;
  input_type: string;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  short_report: string;
  signals: Array<{ label: string }>;
}

export interface FraudRadarStats {
  configured: boolean;
  totalCases: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topSignals: Array<{ label: string; count: number }>;
  caseVolumeByDay: Array<{ date: string; count: number }>;
  recentHighRiskCases: Array<{
    id: string;
    createdAt: string;
    inputType: string;
    riskScore: number;
    shortReport: string;
  }>;
}

function emptyStats(configured: boolean): FraudRadarStats {
  return {
    configured,
    totalCases: 0,
    riskDistribution: {
      low: 0,
      medium: 0,
      high: 0,
    },
    topSignals: [],
    caseVolumeByDay: getRecentDayBuckets([]),
    recentHighRiskCases: [],
  };
}

function getRecentDayBuckets(rows: CaseAnalyticsRow[], days = 14) {
  const counts = new Map<string, number>();
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    counts.set(date.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function getFraudRadarStats(): Promise<FraudRadarStats> {
  if (!isSupabaseConfigured()) {
    return emptyStats(false);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select("id, created_at, input_type, risk_level, risk_score, short_report, signals")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[ScamShield] Failed to load FraudRadar stats:", error.message);
    return emptyStats(true);
  }

  const rows = (data ?? []) as CaseAnalyticsRow[];
  const riskDistribution = rows.reduce(
    (acc, row) => {
      acc[row.risk_level] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 },
  );

  const signalCounts = new Map<string, number>();
  for (const row of rows) {
    for (const signal of row.signals ?? []) {
      signalCounts.set(signal.label, (signalCounts.get(signal.label) ?? 0) + 1);
    }
  }

  const topSignals = Array.from(signalCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recentHighRiskCases = rows
    .filter((row) => row.risk_level === "high")
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      inputType: row.input_type,
      riskScore: row.risk_score,
      shortReport: row.short_report,
    }));

  return {
    configured: true,
    totalCases: rows.length,
    riskDistribution,
    topSignals,
    caseVolumeByDay: getRecentDayBuckets(rows),
    recentHighRiskCases,
  };
}
