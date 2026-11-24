import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FROM, SENDING_DOMAIN, resolveFromAddress } from "../email";
import { isFlagOn, runLeadPipeline, type LeadEnv, type LeadSink } from "../pipeline";
import { defaultSinks, lightfieldSink, logSink, protonSink, resendSink, slackSink } from "../sinks";
import { jsonResponse, makeLead, silentLogger } from "./fixtures";

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

function okFetch(): FetchMock {
  return vi.fn<typeof fetch>(async () => jsonResponse({ id: "ok" }));
}

function run(env: LeadEnv, fetchMock: FetchMock = okFetch(), sinks: readonly LeadSink[] = defaultSinks) {
  const logger = silentLogger();
  return runLeadPipeline(makeLead(), { sinks, env, fetch: fetchMock, logger }).then((result) => ({
    result,
    fetchMock,
    logger,
  }));
}

function statusOf(results: { sink: string; status: string }[], sink: string) {
  return results.find((r) => r.sink === sink)?.status;
}

function sentBody(fetchMock: FetchMock, call = 0) {
  const init = fetchMock.mock.calls[call][1];
  return JSON.parse(String(init?.body));
}

describe("isFlagOn", () => {
  it("is on only for the exact string true", () => {
    expect(isFlagOn("true")).toBe(true);
    for (const value of ["TRUE", "True", " true", "true ", "1", "yes", "on", "false", "", undefined]) {
      expect(isFlagOn(value)).toBe(false);
    }
  });
});

describe("lead pipeline with nothing configured", () => {
  it("logs the structured lead, reports success and makes no network calls", async () => {
    const { result, fetchMock, logger } = await run({});

    expect(result.accepted).toBe(true);
    expect(statusOf(result.results, "log")).toBe("delivered");
    for (const sink of ["resend", "proton", "lightfield", "slack"]) {
      expect(statusOf(result.results, sink)).toBe("skipped");
    }
    expect(fetchMock).not.toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(logger.info.mock.calls[0][1] as string);
    expect(logged.event).toBe("lead.received");
    expect(logged.lead).toEqual(makeLead());
  });

  it("keeps the log sink as the first sink", () => {
    expect(defaultSinks[0]).toBe(logSink);
    expect(logSink.isEnabled({})).toBe(true);
  });
});

describe("resend adapter gating", () => {
  const configured: LeadEnv = {
    RESEND_API_KEY: "re_test",
    LEAD_NOTIFY_TO: "nathan@example.com",
  };

  it("stays off when the API key is present but the flag is missing", async () => {
    const { result, fetchMock } = await run(configured);
    expect(statusOf(result.results, "resend")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["false", "TRUE", "1", "yes", ""])("stays off when the flag is %j", async (flag) => {
    const { result, fetchMock } = await run({ ...configured, LEAD_RESEND_ENABLED: flag });
    expect(statusOf(result.results, "resend")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays off when the flag is on but there is no API key or no recipient", () => {
    expect(resendSink.isEnabled({ LEAD_RESEND_ENABLED: "true" })).toBe(false);
    expect(resendSink.isEnabled({ LEAD_RESEND_ENABLED: "true", RESEND_API_KEY: "re_test" })).toBe(false);
    expect(
      resendSink.isEnabled({ LEAD_RESEND_ENABLED: "true", LEAD_NOTIFY_TO: "nathan@example.com" })
    ).toBe(false);
  });

  it("sends from the sending subdomain when the flag is exactly true", async () => {
    const { result, fetchMock } = await run({ ...configured, LEAD_RESEND_ENABLED: "true" });

    expect(statusOf(result.results, "resend")).toBe("delivered");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");

    const body = sentBody(fetchMock);
    expect(body.from).toBe(DEFAULT_FROM);
    expect(body.from).toContain(`@${SENDING_DOMAIN}`);
    expect(body.to).toEqual(["nathan@example.com"]);
    expect(body.reply_to).toBe("ada@example.com");
    expect(body.subject).toContain("Ada Example");
    expect(body.text).toContain("how-to-position-a-startup");
  });

  it("falls back to CONTACT_EMAIL as the recipient", async () => {
    const { fetchMock } = await run({
      LEAD_RESEND_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      CONTACT_EMAIL: "hello@example.com",
    });
    expect(sentBody(fetchMock).to).toEqual(["hello@example.com"]);
  });

  it("escapes HTML in the email body", async () => {
    const lead = makeLead({ workingOn: "Margins < 10% & falling > expected" });
    const fetchMock = okFetch();
    await runLeadPipeline(lead, {
      sinks: [resendSink],
      env: { ...configured, LEAD_RESEND_ENABLED: "true" },
      fetch: fetchMock,
      logger: silentLogger(),
    });
    expect(sentBody(fetchMock).html).toContain("Margins &lt; 10% &amp; falling &gt; expected");
  });
});

describe("resolveFromAddress", () => {
  it("defaults to leads@send.signalhaus.ai", () => {
    expect(resolveFromAddress({})).toBe("Signalhaus leads <leads@send.signalhaus.ai>");
  });

  it("accepts another address on the sending subdomain", () => {
    expect(resolveFromAddress({ LEAD_NOTIFY_FROM: "hello@send.signalhaus.ai" })).toBe(
      "hello@send.signalhaus.ai"
    );
    expect(resolveFromAddress({ LEAD_NOTIFY_FROM: "Nathan <nathan@send.signalhaus.ai>" })).toBe(
      "Nathan <nathan@send.signalhaus.ai>"
    );
  });

  it.each([
    "no-reply@signalhaus.ai",
    "Signalhaus <hello@signalhaus.ai>",
    "leads@send.signalhaus.ai.evil.example",
    "leads@notsend.signalhaus.ai",
    "leads@example.com",
    "not an address",
  ])("never sends from %s", (from) => {
    const logger = silentLogger();
    expect(resolveFromAddress({ LEAD_NOTIFY_FROM: from }, logger)).toBe(DEFAULT_FROM);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});

describe("proton inbox adapter gating", () => {
  const base: LeadEnv = { RESEND_API_KEY: "re_test", LEAD_PROTON_INBOX: "nathan@proton.me" };

  it("is off without the Resend flag, even with a recipient and key", async () => {
    const { result, fetchMock } = await run(base);
    expect(statusOf(result.results, "proton")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is off when no Proton address is set", () => {
    expect(protonSink.isEnabled({ LEAD_RESEND_ENABLED: "true", RESEND_API_KEY: "re_test" })).toBe(false);
  });

  it("sends a copy to the Proton inbox when enabled", async () => {
    const { result, fetchMock } = await run({ ...base, LEAD_RESEND_ENABLED: "true" });
    expect(statusOf(result.results, "proton")).toBe("delivered");
    expect(statusOf(result.results, "resend")).toBe("skipped");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = sentBody(fetchMock);
    expect(body.to).toEqual(["nathan@proton.me"]);
    expect(body.from).toContain(`@${SENDING_DOMAIN}`);
  });

  it("does not send twice when the Proton inbox is already the main recipient", async () => {
    const { result, fetchMock } = await run({
      ...base,
      LEAD_RESEND_ENABLED: "true",
      LEAD_NOTIFY_TO: "Nathan@Proton.me",
    });
    expect(statusOf(result.results, "resend")).toBe("delivered");
    expect(statusOf(result.results, "proton")).toBe("skipped");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("lightfield adapter gating", () => {
  it.each<LeadEnv>([
    {},
    { LIGHTFIELD_API_KEY: "lf_test" },
    { LEAD_LIGHTFIELD_ENABLED: "true" },
    { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "false" },
    { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "TRUE" },
  ])("is off for %j", async (env) => {
    const { result, fetchMock } = await run(env);
    expect(statusOf(result.results, "lightfield")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const enabled: LeadEnv = { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "true" };

  function lightfieldFetch(existing: { contact?: object; account?: object; opportunity?: object }) {
    return vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      const resource = url.pathname.replace("/v1/", "");
      if (method === "GET") {
        const hit =
          resource === "contacts"
            ? existing.contact
            : resource === "accounts"
              ? existing.account
              : existing.opportunity;
        return jsonResponse({ data: hit ? [hit] : [], object: "list", totalCount: hit ? 1 : 0 });
      }
      return jsonResponse({ id: `new_${resource}` });
    });
  }

  function calls(fetchMock: FetchMock) {
    return fetchMock.mock.calls.map(([input, init]) => {
      const url = new URL(String(input));
      return {
        method: init?.method ?? "GET",
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        headers: init?.headers as Record<string, string>,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      };
    });
  }

  it("creates the account, contact, opportunity and note for a new lead", async () => {
    const fetchMock = lightfieldFetch({});
    const { result } = await run(enabled, fetchMock, [lightfieldSink]);
    expect(statusOf(result.results, "lightfield")).toBe("delivered");

    const made = calls(fetchMock);
    expect(made.map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /v1/contacts",
      "GET /v1/accounts",
      "POST /v1/accounts",
      "POST /v1/contacts",
      "GET /v1/opportunities",
      "POST /v1/opportunities",
      "POST /v1/notes",
    ]);

    for (const call of made) {
      expect(call.headers.Authorization).toBe("Bearer lf_test");
      expect(call.headers["Lightfield-Version"]).toBe("2026-03-01");
      if (call.method === "POST") expect(call.headers["Idempotency-Key"]).toContain(makeLead().id);
    }

    expect(made[0].query["$email[contains]"]).toBe("ada@example.com");
    expect(made[2].body).toEqual({ fields: { $name: "Example Labs" } });
    expect(made[3].body).toEqual({
      fields: { $email: ["ada@example.com"], $name: { firstName: "Ada", lastName: "Example" } },
      relationships: { $account: "new_accounts" },
      skipEnrichment: true,
    });
    expect(made[5].body).toEqual({
      fields: { $name: "Website lead: Ada Example - Positioning" },
      relationships: { $account: "new_accounts" },
    });
    expect(made[6].body.relationships).toEqual({
      $account: "new_accounts",
      $contact: "new_contacts",
      $opportunity: "new_opportunities",
    });
    expect(made[6].body.fields.$content).toContain("Working out which customer segment");
  });

  it("reuses existing records and only adds a note", async () => {
    const fetchMock = lightfieldFetch({
      contact: { id: "con_1", relationships: { $account: { values: ["acc_1"] } } },
      opportunity: { id: "opp_1" },
    });
    const { result } = await run(enabled, fetchMock, [lightfieldSink]);
    expect(statusOf(result.results, "lightfield")).toBe("delivered");

    const made = calls(fetchMock);
    expect(made.map((c) => `${c.method} ${c.path}`)).toEqual([
      "GET /v1/contacts",
      "GET /v1/opportunities",
      "POST /v1/notes",
    ]);
    expect(made[1].query["$account[contains]"]).toBe("acc_1");
    expect(made[2].body.relationships).toEqual({
      $account: "acc_1",
      $contact: "con_1",
      $opportunity: "opp_1",
    });
  });

  it("honours a custom base URL", async () => {
    const fetchMock = lightfieldFetch({});
    await run({ ...enabled, LIGHTFIELD_API_BASE_URL: "https://lf.test/" }, fetchMock, [lightfieldSink]);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/lf\.test\/v1\/contacts\?/);
  });
});

describe("slack adapter gating", () => {
  it("is off unless the flag and the webhook are both set", async () => {
    expect(slackSink.isEnabled({ SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" })).toBe(false);
    expect(slackSink.isEnabled({ LEAD_SLACK_ENABLED: "true" })).toBe(false);
    const { fetchMock } = await run({ SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to the webhook when enabled", async () => {
    const { result, fetchMock } = await run({
      SLACK_WEBHOOK_URL: "https://hooks.slack.test/x",
      LEAD_SLACK_ENABLED: "true",
    });
    expect(statusOf(result.results, "slack")).toBe("delivered");
    expect(fetchMock.mock.calls[0][0]).toBe("https://hooks.slack.test/x");
  });
});

describe("pipeline failure handling", () => {
  it("still accepts the lead when an adapter fails", async () => {
    const failing = vi.fn<typeof fetch>(async () => jsonResponse({ message: "nope" }, 500));
    const { result, logger } = await run(
      { LEAD_RESEND_ENABLED: "true", RESEND_API_KEY: "re_test", LEAD_NOTIFY_TO: "nathan@example.com" },
      failing
    );
    expect(result.accepted).toBe(true);
    expect(statusOf(result.results, "log")).toBe("delivered");
    expect(statusOf(result.results, "resend")).toBe("failed");
    expect(logger.error).toHaveBeenCalled();
  });

  it("still accepts the lead when an adapter throws", async () => {
    const throwing = vi.fn<typeof fetch>(async () => {
      throw new Error("network down");
    });
    const { result } = await run(
      { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "true" },
      throwing
    );
    expect(result.accepted).toBe(true);
    expect(result.results.find((r) => r.sink === "lightfield")).toMatchObject({
      status: "failed",
      error: "network down",
    });
  });

  it("gives up on a sink that hangs", async () => {
    const hanging: LeadSink = {
      name: "hanging",
      isEnabled: () => true,
      deliver: () => new Promise<void>(() => {}),
    };
    const result = await runLeadPipeline(makeLead(), {
      sinks: [logSink, hanging],
      env: {},
      logger: silentLogger(),
      sinkTimeoutMs: 10,
    });
    expect(result.accepted).toBe(true);
    expect(statusOf(result.results, "hanging")).toBe("failed");
  });

  it("is not accepted when no sink takes the lead", async () => {
    const broken: LeadSink = {
      name: "broken",
      isEnabled: () => true,
      deliver: async () => {
        throw new Error("boom");
      },
    };
    const result = await runLeadPipeline(makeLead(), {
      sinks: [broken],
      env: {},
      logger: silentLogger(),
    });
    expect(result.accepted).toBe(false);
  });
});
