import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validBody } from "@/lib/leads/__tests__/fixtures";
import { DELIVERY_FAILED_MESSAGE } from "@/lib/leads/schema";
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
  "LIGHTFIELD_PIPELINE_OPTION",
  "LIGHTFIELD_STAGE_LEAD",
  "LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD",
  "LEAD_SLACK_ENABLED",
  "SLACK_WEBHOOK_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "VERCEL_ENV",
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
    .map((call) => JSON.parse(call[1] as string));
}

function stubResend() {
  vi.stubEnv("RESEND_API_KEY", "re_live_key");
  vi.stubEnv("LEAD_RESEND_ENABLED", "true");
  vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");
}

function stubSlack() {
  vi.stubEnv("LEAD_SLACK_ENABLED", "true");
  vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.test/services/x");
}

function stubLightfield() {
  vi.stubEnv("LEAD_LIGHTFIELD_ENABLED", "true");
  vi.stubEnv("LIGHTFIELD_API_KEY", "lf_key");
  vi.stubEnv("LIGHTFIELD_STAGE_LEAD", "opt_lead");
}

function stubProtonCopy() {
  vi.stubEnv("RESEND_API_KEY", "re_live_key");
  vi.stubEnv("LEAD_RESEND_ENABLED", "true");
  vi.stubEnv("LEAD_NOTIFY_TO", "nathan@proton.me");
  vi.stubEnv("LEAD_PROTON_INBOX", "copy@proton.me");
}

describe("POST /api/leads", () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let log: ReturnType<typeof vi.spyOn>;
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetInMemoryRateLimit();
    for (const key of ENV_KEYS) vi.stubEnv(key, "");
    fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function consoleOutput(): string {
    return JSON.stringify([log, errorLog, vi.mocked(console.warn)].flatMap((spy) => spy.mock.calls));
  }

  function failFor(...hosts: string[]) {
    fetchMock.mockImplementation(async (input) =>
      hosts.some((host) => String(input).includes(host))
        ? new Response("down", { status: 503 })
        : new Response(JSON.stringify({ id: "ok", data: [] }), { status: 200 })
    );
  }

  async function expectTurnedAway(response: Response) {
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: DELIVERY_FAILED_MESSAGE });
  }

  describe("with no record sink switched on", () => {
    it("returns an error, logs a masked line and sends nothing anywhere", async () => {
      const response = await post(validBody());

      await expectTurnedAway(response);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggedLeads(log)).toEqual([
        {
          event: "lead.received",
          id: expect.stringMatching(/^[0-9a-f-]{36}$/),
          email: "a***@example.com",
          topic: "positioning",
          source: "blog-post",
          postSlug: "how-to-position-a-startup",
        },
      ]);
      expect(
        errorLog.mock.calls.some((call: unknown[]) => String(call[0]).includes("no record sink is switched on"))
      ).toBe(true);
    });

    it.each([
      ["NODE_ENV", "production"],
      ["NODE_ENV", "development"],
      ["NODE_ENV", "test"],
      ["VERCEL_ENV", "production"],
      ["VERCEL_ENV", "preview"],
      ["VERCEL_ENV", "development"],
    ])("returns the same error when %s is %s", async (key, value) => {
      vi.stubEnv(key, value);
      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns an error when the keys are set but every switch is off", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_preview_key");
      vi.stubEnv("LEAD_RESEND_ENABLED", "false");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");
      vi.stubEnv("CONTACT_EMAIL", "hello@example.com");
      vi.stubEnv("LEAD_PROTON_INBOX", "nathan@proton.me");
      vi.stubEnv("LIGHTFIELD_API_KEY", "lf_key");
      vi.stubEnv("LIGHTFIELD_STAGE_LEAD", "opt_lead");
      vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.test/services/x");

      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns an error when only Slack is on, even though Slack delivers", async () => {
      stubSlack();

      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).toContain("hooks.slack.test");
    });
  });

  describe("a sink that is switched on but not configured", () => {
    function misconfigurations() {
      return errorLog.mock.calls
        .filter((call: unknown[]) => String(call[0]).includes("is switched on but not configured"))
        .map((call: unknown[]) => [call[0], call[1]]);
    }

    it("returns an error when Resend is on with no recipient", async () => {
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("RESEND_API_KEY", "re_live_key");

      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(misconfigurations()).toEqual([
        ['[leads] sink "resend" is switched on but not configured', { missing: ["LEAD_NOTIFY_TO"] }],
      ]);
    });

    it("returns an error when Resend is on with no API key", async () => {
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("LEAD_NOTIFY_TO", "nathan@example.com");

      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(misconfigurations()).toEqual([
        ['[leads] sink "resend" is switched on but not configured', { missing: ["RESEND_API_KEY"] }],
      ]);
    });

    it.each([
      ["no key", { LIGHTFIELD_STAGE_LEAD: "opt_lead" }, ["LIGHTFIELD_API_KEY"]],
      ["no stage", { LIGHTFIELD_API_KEY: "lf_key" }, ["LIGHTFIELD_STAGE_LEAD"]],
      ["no key and no stage", {}, ["LIGHTFIELD_API_KEY", "LIGHTFIELD_STAGE_LEAD"]],
    ])("returns an error when Lightfield is on with %s", async (_case, env, missing) => {
      vi.stubEnv("LEAD_LIGHTFIELD_ENABLED", "true");
      for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);

      await expectTurnedAway(await post(validBody()));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(misconfigurations()).toEqual([
        ['[leads] sink "lightfield" is switched on but not configured', { missing }],
      ]);
    });

    it("says which lead was turned away, and why, without anything about the person", async () => {
      vi.stubEnv("LEAD_RESEND_ENABLED", "true");
      vi.stubEnv("RESEND_API_KEY", "re_live_key");

      await post(validBody());

      const written = consoleOutput();
      expect(written).toContain("no record sink accepted it");
      expect(written).toContain("a***@example.com");
      for (const secret of ["Ada", "ada@example.com", "Example Labs", "customer segment", "re_live_key"]) {
        expect(written).not.toContain(secret);
      }
    });

    it("still succeeds when another record sink is configured and delivers", async () => {
      stubResend();
      vi.stubEnv("LEAD_LIGHTFIELD_ENABLED", "true");
      failFor();

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(misconfigurations()).toHaveLength(1);
    });
  });

  describe("delivery", () => {
    it("logs a masked line and returns success once a record sink has the lead", async () => {
      stubResend();

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(loggedLeads(log)).toEqual([
        {
          event: "lead.received",
          id: expect.stringMatching(/^[0-9a-f-]{36}$/),
          email: "a***@example.com",
          topic: "positioning",
          source: "blog-post",
          postSlug: "how-to-position-a-startup",
        },
      ]);
    });

    it("never writes the name, the message or the full email to any console", async () => {
      stubResend();
      fetchMock.mockResolvedValue(new Response("down", { status: 503 }));

      await post(validBody());
      await post(validBody({ name: "", email: "nope" }));

      const written = consoleOutput();
      expect(written).toContain("a***@example.com");
      for (const secret of ["Ada", "ada@example.com", "Example Labs", "customer segment"]) {
        expect(written).not.toContain(secret);
      }
    });

    it("emails from the sending subdomain once LEAD_RESEND_ENABLED is true", async () => {
      stubResend();
      vi.stubEnv("LEAD_NOTIFY_FROM", "no-reply@signalhaus.ai");

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.resend.com/emails");
      expect(JSON.parse(String(init?.body)).from).toBe("Signalhaus leads <leads@send.signalhaus.ai>");
    });

    it.each([
      ["Resend", stubResend],
      ["the Proton copy", stubProtonCopy],
      ["Lightfield", stubLightfield],
    ])("succeeds when %s is on and delivers", async (_name, enable) => {
      enable();
      failFor();
      const response = await post(validBody());
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalled();
    });

    it.each([
      ["Resend", stubResend],
      ["Lightfield", stubLightfield],
    ])("returns an error when %s is the only record sink and it fails", async (_name, enable) => {
      enable();
      fetchMock.mockResolvedValue(new Response("down", { status: 503 }));

      await expectTurnedAway(await post(validBody()));
      expect(loggedLeads(log)).toHaveLength(1);
      expect(
        errorLog.mock.calls.some((call: unknown[]) => String(call[0]).includes("no record sink accepted it"))
      ).toBe(true);
    });

    it("returns an error when a record sink cannot be reached at all", async () => {
      stubResend();
      fetchMock.mockRejectedValue(new TypeError("fetch failed"));
      await expectTurnedAway(await post(validBody()));
    });

    it("returns an error when the record sink fails, even though Slack delivers", async () => {
      stubResend();
      stubSlack();
      failFor("api.resend.com");

      await expectTurnedAway(await post(validBody()));
    });

    it("succeeds when the record sink delivers and Slack fails", async () => {
      stubResend();
      stubSlack();
      failFor("hooks.slack.test");

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });

    it("succeeds when one record sink delivers and the other fails", async () => {
      stubResend();
      stubLightfield();
      failFor("api.lightfield.app");

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });

    it("returns an error when every enabled sink fails", async () => {
      stubResend();
      stubLightfield();
      stubSlack();
      failFor("api.resend.com", "api.lightfield.app", "hooks.slack.test");

      await expectTurnedAway(await post(validBody()));
    });

    it("does not count a sink that is switched off as a failure", async () => {
      stubResend();
      vi.stubEnv("LIGHTFIELD_API_KEY", "lf_key");
      vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.test/services/x");
      failFor();

      const response = await post(validBody());

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("validation", () => {
    beforeEach(stubResend);

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

    it("accepts ordinary text that has a word starting with 'on' before an equals sign", async () => {
      const response = await post(validBody({ workingOn: "Our onboarding = 3 weeks and it should be one." }));
      expect(response.status).toBe(200);
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
      expect(loggedLeads(log)[0]).toMatchObject({ source: "unknown", postSlug: null });
    });
  });

  describe("honeypot", () => {
    it("answers success but drops the submission", async () => {
      stubResend();

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
      stubResend();
      const response = await post(validBody({ website: "" }));
      expect(response.status).toBe(200);
      expect(loggedLeads(log)).toHaveLength(1);
    });
  });

  describe("rate limiting", () => {
    beforeEach(stubResend);

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
