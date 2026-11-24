import { vi } from "vitest";
import type { Lead } from "../schema";

export function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Ada Example",
    email: "ada@example.com",
    company: "Example Labs",
    role: "Founder",
    workingOn: "Working out which customer segment to go after first.",
    topic: "positioning",
    website: "",
    attribution: {
      leadSource: "blog-post",
      pagePath: "/blog/how-to-position-a-startup",
      postSlug: "how-to-position-a-startup",
      landingPath: "/",
      referrer: "https://www.google.com/",
      utm: { source: "newsletter", medium: "email", campaign: "launch" },
    },
    ...overrides,
  };
}

export function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    receivedAt: "2026-11-23T12:00:00.000Z",
    name: "Ada Example",
    email: "ada@example.com",
    company: "Example Labs",
    role: "Founder",
    workingOn: "Working out which customer segment to go after first.",
    topic: "positioning",
    attribution: {
      leadSource: "blog-post",
      pagePath: "/blog/how-to-position-a-startup",
      postSlug: "how-to-position-a-startup",
      landingPath: "/",
      referrer: "https://www.google.com/",
      utm: { source: "newsletter", medium: "email", campaign: "launch" },
    },
    ...overrides,
  };
}

export function silentLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
