import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validBody } from "@/lib/leads/__tests__/fixtures";
import { RATE_LIMIT_MAX, resetInMemoryRateLimit } from "@/lib/rate-limit";
import { POST } from "../route";

const ENV_KEYS = [
  "LEAD_RESEND_ENABLED",
  "RESEND_API_KEY",
  "LEAD_NOTIFY_TO",
  "LEAD_NOTIFY_FROM",
  "CONTACT_EMAIL",
  "LEAD_PROTON_INBOX",
  "LEAD_LIGHTFIELD_ENABLED",
  "LIGHTFIELD_API_KEY",
  "LEAD_SLACK_ENABLED",
  "SLACK_WEBHOOK_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

function post(body: unknown, ip = "203.0.113.10"): Promise<Response> {
  return POST(
    new Request("https://www.signalhaus.ai/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

function loggedLeads(log: { mock: { calls: unknown[][] } }) {
  return log.mock.calls
    .filter((call) => call[0] === "[leads] new lead")
    .map((call) => JSON.parse(call[1] as string).lead);
}

describe("POST /api/leads", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetInMemoryRateLimit();
    for (const key of ENV_KEYS) vi.stubEnv(key, "");
    fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("stub sink", () => {
    it("logs the structured lead and returns success", async () => {
      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });

      const leads = loggedLeads(log);
      expect(leads).toHaveLength(1);
      expect(leads[0]).toMatchObject({
        name: "Ada Example",
        email: "ada@example.com",
        company: "Example Labs",
        role: "Founder",
        topic: "positioning",
        workingOn: "Working out which customer segment to go after first.",
        attribution: {
          leadSource: "blog-post",
          pagePath: "/blog/how-to-position-a-startup",
          postSlug: "how-to-position-a-startup",
          landingPath: "/",
          referrer: "https://www.google.com/",
          utm: { source: "newsletter", medium: "email", campaign: "launch" },
        },
      });
      expect(leads[0].id).toMatch(/^[0-9a-f-]{36}$/);
      expect(Number.isNaN(Date.parse(leads[0].receivedAt))).toBe(false);
    });

    it("sends nothing anywhere when no adapter is configured", async () => {
      await post(validBody());
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("sends nothing when RESEND_API_KEY is set but LEAD_RESEND_ENABLED is false", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_preview_key");
      vi.stubEnv("LEAD_RESEND_ENABLED", "false");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");
      vi.stubEnv("CONTACT_EMAIL", "hello@example.com");
      vi.stubEnv("LEAD_PROTON_INBOX", "nathan@proton.me");

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggedLeads(log)).toHaveLength(1);
    });

    it("sends nothing to Lightfield when the key is set but the flag is not", async () => {
      vi.stubEnv("LIGHTFIELD_API_KEY", "lf_key");
      await post(validBody());
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("emails from the sending subdomain once LEAD_RESEND_ENABLED is true", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_live_key");
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");
      vi.stubEnv("LEAD_NOTIFY_FROM", "no-reply@signalhaus.ai");

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(JSON.parse(String(init?.body)).from).toBe("Signalhaus leads <leads@send.signalhaus.ai>");
    });

    it("still succeeds when an enabled adapter fails", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_live_key");
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");
      fetchMock.mockResolvedValue(new Response("down", { status: 503 }));

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(loggedLeads(log)).toHaveLength(1);
    });
  });

  describe("validation", () => {
    it("returns 422 with a message per field", async () => {
      const response = await post({ name: "", email: "nope", workingOn: "hi", topic: "pricing" });

      expect(response.status).toBe(422);
      const payload = await response.json();
      expect(payload.error).toBe("Validation failed");
      expect(Object.keys(payload.fieldErrors).sort()).toEqual(["email", "name", "topic", "workingOn"]);
      expect(loggedLeads(log)).toHaveLength(0);
    });

    it("returns 422 when a required field is missing", async () => {
      const body = validBody();
      delete body.email;
      const response = await post(body);
      expect(response.status).toBe(422);
      expect((await response.json()).fieldErrors.email).toBeDefined();
    });

    it("returns 422 for script-like content", async () => {
      const response = await post(validBody({ workingOn: "<script>alert('x')</script> hello there" }));
      expect(response.status).toBe(422);
      expect(loggedLeads(log)).toHaveLength(0);
    });

    it("returns 422 for a JSON body that is not an object", async () => {
      const response = await post(["not", "an", "object"]);
      expect(response.status).toBe(422);
    });

    it("returns 400 for a body that is not JSON", async () => {
      const response = await post("name=Ada&email=ada@example.com");
      expect(response.status).toBe(400);
      expect(loggedLeads(log)).toHaveLength(0);
    });

    it("returns 413 for an oversized body", async () => {
      const response = await post(validBody({ workingOn: "a".repeat(30_000) }));
      expect(response.status).toBe(413);
    });

    it("accepts a submission with no attribution and fills in defaults", async () => {
      const body = validBody();
      delete body.attribution;
      const response = await post(body);
      expect(response.status).toBe(200);
      expect(loggedLeads(log)[0].attribution).toEqual({
        leadSource: "unknown",
        pagePath: "/",
        postSlug: null,
        landingPath: null,
        referrer: null,
        utm: {},
      });
    });
  });

  describe("honeypot", () => {
    it("answers success but drops the submission", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_live_key");
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");

      const response = await post(validBody({ website: "https://spam.example" }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(loggedLeads(log)).toHaveLength(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("drops a bot submission even when the other fields are invalid", async () => {
      const response = await post({ website: "x", email: "nope" });
      expect(response.status).toBe(200);
      expect(loggedLeads(log)).toHaveLength(0);
    });

    it("lets a real submission through when the hidden field is empty", async () => {
      const response = await post(validBody({ website: "" }));
      expect(response.status).toBe(200);
      expect(loggedLeads(log)).toHaveLength(1);
    });
  });

  describe("rate limiting", () => {
    it("allows five submissions per IP and then returns 429", async () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        expect((await post(validBody(), "198.51.100.7")).status).toBe(200);
      }
      const blocked = await post(validBody(), "198.51.100.7");
      expect(blocked.status).toBe(429);
      expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
      expect(loggedLeads(log)).toHaveLength(RATE_LIMIT_MAX);
    });

    it("counts each IP separately", async () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) await post(validBody(), "198.51.100.8");
      expect((await post(validBody(), "198.51.100.9")).status).toBe(200);
    });

    it("counts honeypot hits too", async () => {
      for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        await post(validBody({ website: "spam" }), "198.51.100.10");
      }
      expect((await post(validBody(), "198.51.100.10")).status).toBe(429);
    });
  });
});
