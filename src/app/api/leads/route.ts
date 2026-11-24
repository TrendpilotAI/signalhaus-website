import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { runLeadPipeline } from "@/lib/leads/pipeline";
import { DELIVERY_FAILED_MESSAGE, isHoneypotTripped, validateLead, type Lead } from "@/lib/leads/schema";
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
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
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

  // Fail closed. The lead only counts once a record sink (an inbox or the CRM)
  // has it. A Slack ping or the line in the log does not keep the lead, and
  // neither does a deployment with no record sink switched on. This is the
  // same in every environment.
  const { accepted, rejection } = await runLeadPipeline(lead, { sinks: defaultSinks });
  if (!accepted) {
    console.error(
      rejection === "no-record-sink-enabled"
        ? `[leads] lead ${lead.id} was turned away because no record sink is switched on. Set up Resend or Lightfield.`
        : `[leads] lead ${lead.id} was turned away because no record sink accepted it`
    );
    return NextResponse.json({ error: DELIVERY_FAILED_MESSAGE }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
