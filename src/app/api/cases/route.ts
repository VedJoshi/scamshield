import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { savedCaseSchema } from "@/features/analysis/schemas/analysis";
import type { SavedCase } from "@/features/analysis/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const runtime = "nodejs";

const SESSION_COOKIE = "scamshield.session-id";

interface CaseRow {
  id: string;
  created_at: string;
  input_type: SavedCase["request"]["inputType"];
  raw_input: string;
  locale: SavedCase["request"]["locale"];
  risk_level: SavedCase["result"]["riskLevel"];
  risk_score: number;
  signals: SavedCase["result"]["signals"];
  reasons: SavedCase["result"]["reasons"];
  recommended_action: string;
  short_report: string;
}

async function getSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  return existing ?? crypto.randomUUID();
}

function attachSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

function mapRowToCase(row: CaseRow): SavedCase {
  return {
    id: row.id,
    createdAt: row.created_at,
    request: {
      inputType: row.input_type,
      rawInput: row.raw_input,
      locale: row.locale,
    },
    result: {
      riskLevel: row.risk_level,
      riskScore: row.risk_score,
      signals: row.signals,
      reasons: row.reasons,
      recommendedAction: row.recommended_action,
      shortReport: row.short_report,
    },
  };
}

export async function GET() {
  const sessionId = await getSessionId();

  if (!isSupabaseConfigured()) {
    return attachSessionCookie(
      NextResponse.json({ cases: [], storage: "local", error: "Supabase is not configured." }),
      sessionId,
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      "id, created_at, input_type, raw_input, locale, risk_level, risk_score, signals, reasons, recommended_action, short_report",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[ScamShield] Failed to load Supabase cases:", error.message);
    return attachSessionCookie(
      NextResponse.json({ cases: [], storage: "local", error: "Case history is temporarily unavailable." }),
      sessionId,
    );
  }

  return attachSessionCookie(
    NextResponse.json({ cases: (data as CaseRow[]).map(mapRowToCase), storage: "supabase" }),
    sessionId,
  );
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();

  try {
    const body = await request.json();
    const savedCase = savedCaseSchema.parse(body);

    if (!isSupabaseConfigured()) {
      return attachSessionCookie(
        NextResponse.json({ case: savedCase, storage: "local", error: "Supabase is not configured." }),
        sessionId,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        id: savedCase.id,
        created_at: savedCase.createdAt,
        session_id: sessionId,
        input_type: savedCase.request.inputType,
        raw_input: savedCase.request.rawInput,
        locale: savedCase.request.locale,
        risk_level: savedCase.result.riskLevel,
        risk_score: savedCase.result.riskScore,
        signals: savedCase.result.signals,
        reasons: savedCase.result.reasons,
        recommended_action: savedCase.result.recommendedAction,
        short_report: savedCase.result.shortReport,
      })
      .select(
        "id, created_at, input_type, raw_input, locale, risk_level, risk_score, signals, reasons, recommended_action, short_report",
      )
      .single();

    if (error) {
      console.error("[ScamShield] Failed to save Supabase case:", error.message);
      return attachSessionCookie(
        NextResponse.json({ case: savedCase, storage: "local", error: "Case history is temporarily unavailable." }),
        sessionId,
      );
    }

    return attachSessionCookie(
      NextResponse.json({ case: mapRowToCase(data as CaseRow), storage: "supabase" }),
      sessionId,
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return attachSessionCookie(
        NextResponse.json({ error: "Invalid case payload." }, { status: 400 }),
        sessionId,
      );
    }

    console.error("[ScamShield] Case API error:", error);
    return attachSessionCookie(
      NextResponse.json({ error: "Could not save this case." }, { status: 500 }),
      sessionId,
    );
  }
}
