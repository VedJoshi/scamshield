import { NextResponse } from "next/server";

interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  message?: string;
}

const rateMap = new Map<string, { count: number; windowStart: number }>();

function getClientKey(request: Request, keyPrefix: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return `${keyPrefix}:${forwardedFor || realIp || "unknown"}`;
}

export function checkRateLimit(request: Request, options: RateLimitOptions) {
  const key = getClientKey(request, options.keyPrefix);
  const now = Date.now();
  const entry = rateMap.get(key) ?? { count: 0, windowStart: now };

  if (now - entry.windowStart > options.windowMs) {
    entry.count = 0;
    entry.windowStart = now;
  }

  if (entry.count >= options.limit) {
    return NextResponse.json(
      { error: options.message ?? "Rate limit exceeded. Please try again later." },
      { status: 429 },
    );
  }

  entry.count += 1;
  rateMap.set(key, entry);
  return null;
}
