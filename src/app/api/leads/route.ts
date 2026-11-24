import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runLeadPipeline } from "@/lib/leads/pipeline";
import { isHoneypotTripped, validateLead, type Lead } from "@/lib/leads/schema";
import { defaultSinks } from "@/lib/leads/sinks";
import {
  RATE_LIMIT_MAX,
  getClientIp,
  getRateLimiter,
  inMemoryRateLimiter,
  type RateLimitResult,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const MAX_BODY_BYTES = 20_000;

async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  try {
    return await getRateLimiter().limit(ip);
  } catch (err) {
    console.error("[leads] rate limiter unavailable, using in-memory fallback", {
      error: err instanceof Error ? err.message : String(err),
    });
    return inMemoryRateLimiter.limit(ip);
  }
}

export async function POST(req: Request) {
  const { success, reset } = await checkRateLimit(getClientIp(req.headers));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        },
      }
    );
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read the request body." }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Answer a bot exactly like a real submission, so it learns nothing, and drop it.
  if (isHoneypotTripped(body)) {
    console.warn("[leads] honeypot tripped, submission dropped");
    return NextResponse.json({ success: true });
  }

  const validation = validateLead(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: validation.errors },
      { status: 422 }
    );
  }

  const lead: Lead = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    ...validation.fields,
  };

  const { accepted } = await runLeadPipeline(lead, { sinks: defaultSinks });
  if (!accepted) {
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
