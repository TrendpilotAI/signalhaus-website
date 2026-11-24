import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FROM, SENDING_DOMAIN, resolveFromAddress } from "../email";
import {
  SINK_TIMEOUT_MS,
  isFlagOn,
  readiness,
  runLeadPipeline,
  type LeadEnv,
  type LeadSink,
} from "../pipeline";
import { defaultSinks, lightfieldSink, logSink, protonSink, resendSink, slackSink } from "../sinks";
import {
  DEFAULT_HOLDING_ACCOUNT,
  EMAIL_NOT_VERIFIED,
  LIGHTFIELD_DEADLINE_MS,
  holdingAccountName,
  noteContent,
  opportunityDescription,
  opportunityName,
  stageFields,
} from "../sinks/lightfield";
import { leadLogEntry, maskEmail } from "../sinks/log";
import type { Lead } from "../schema";
import { jsonResponse, makeLead, silentLogger } from "./fixtures";

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

function okFetch(): FetchMock {
  return vi.fn<typeof fetch>(async () => jsonResponse({ id: "ok" }));
}

/** A fetch that never answers, and rejects the way the real one does when its signal aborts. */
function hangingFetch(): FetchMock {
  return vi.fn<typeof fetch>(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) return;
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      })
  );
}

function run(
  env: LeadEnv,
  fetchMock: FetchMock = okFetch(),
  sinks: readonly LeadSink[] = defaultSinks,
  lead: Lead = makeLead()
) {
  const logger = silentLogger();
  return runLeadPipeline(lead, { sinks, env, fetch: fetchMock, logger }).then((result) => ({
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
  it("logs one line, turns the lead away and makes no network calls", async () => {
    const { result, fetchMock, logger } = await run({});

    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-enabled");
    expect(statusOf(result.results, "log")).toBe("delivered");
    for (const sink of ["resend", "proton", "lightfield", "slack"]) {
      expect(statusOf(result.results, sink)).toBe("skipped");
    }
    expect(fetchMock).not.toHaveBeenCalled();

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(JSON.parse(logger.info.mock.calls[0][1] as string)).toEqual({
      event: "lead.received",
      id: makeLead().id,
      email: "a***@example.com",
      topic: "positioning",
      source: "blog-post",
      postSlug: "how-to-position-a-startup",
    });
  });

  it("keeps the log sink as the first sink, and as the only stub", () => {
    expect(defaultSinks[0]).toBe(logSink);
    expect(logSink.readiness({})).toEqual({ state: "ready" });
    expect(defaultSinks.filter((sink) => sink.kind === "stub")).toEqual([logSink]);
  });
});

describe("log sink privacy", () => {
  it.each([
    ["jane@acme.com", "j***@acme.com"],
    ["a@example.org", "a***@example.org"],
    ["first.last+tag@sub.example.co.uk", "f***@sub.example.co.uk"],
    ["not-an-address", "***"],
    ["@example.com", "***"],
  ])("masks %s as %s", (email, masked) => {
    expect(maskEmail(email)).toBe(masked);
  });

  it("logs the masked email, topic, source and slug, and nothing else about the person", async () => {
    const lead = makeLead({
      name: "Zelda Quartermaine",
      email: "zelda.quartermaine@unusual-domain.example",
      company: "Quartermaine Holdings",
      workingOn: "A very private description of the plan.",
    });
    expect(Object.keys(leadLogEntry(lead)).sort()).toEqual([
      "email",
      "event",
      "id",
      "postSlug",
      "source",
      "topic",
    ]);

    const { logger } = await run({}, okFetch(), [logSink], lead);
    const everythingLogged = JSON.stringify([
      logger.info.mock.calls,
      logger.warn.mock.calls,
      logger.error.mock.calls,
    ]);

    expect(everythingLogged).toContain("z***@unusual-domain.example");
    for (const secret of [
      "Zelda",
      "Quartermaine",
      "zelda.quartermaine",
      "Chief Everything Officer",
      "very private description",
      "newsletter",
      "google.com",
    ]) {
      expect(everythingLogged).not.toContain(secret);
    }
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

  it.each<[string, LeadEnv, string[]]>([
    ["no API key and no recipient", {}, ["RESEND_API_KEY", "LEAD_NOTIFY_TO"]],
    ["no recipient", { RESEND_API_KEY: "re_test" }, ["LEAD_NOTIFY_TO"]],
    ["a recipient that is not an address", { RESEND_API_KEY: "re_test", LEAD_NOTIFY_TO: "nathan" }, ["LEAD_NOTIFY_TO"]],
    ["no API key", { LEAD_NOTIFY_TO: "nathan@example.com" }, ["RESEND_API_KEY"]],
  ])("fails, without sending, when the flag is on with %s", async (_case, env, missing) => {
    const on = { ...env, LEAD_RESEND_ENABLED: "true" };
    expect(resendSink.readiness(on)).toEqual({ state: "misconfigured", missing });

    const { result, fetchMock } = await run(on);
    expect(result.results.find((r) => r.sink === "resend")).toEqual({
      sink: "resend",
      status: "failed",
      error: `Not configured. Missing or invalid: ${missing.join(", ")}`,
    });
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-accepted");
    expect(fetchMock).not.toHaveBeenCalled();
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
    for (const inbox of [undefined, "", "  "]) {
      expect(
        protonSink.readiness({ LEAD_RESEND_ENABLED: "true", RESEND_API_KEY: "re_test", LEAD_PROTON_INBOX: inbox })
      ).toEqual({ state: "off" });
    }
  });

  it.each<[string, LeadEnv, string[]]>([
    ["no API key", { LEAD_PROTON_INBOX: "nathan@proton.me" }, ["RESEND_API_KEY"]],
    ["an inbox that is not an address", { RESEND_API_KEY: "re_test", LEAD_PROTON_INBOX: "proton" }, ["LEAD_PROTON_INBOX"]],
  ])("fails, without sending, when the flag is on with %s", async (_case, env, missing) => {
    const { result, fetchMock } = await run({ ...env, LEAD_RESEND_ENABLED: "true" }, okFetch(), [protonSink]);
    expect(result.results[0]).toEqual({
      sink: "proton",
      status: "failed",
      error: `Not configured. Missing or invalid: ${missing.join(", ")}`,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a copy to the Proton inbox when enabled", async () => {
    const { result, fetchMock } = await run({ ...base, LEAD_RESEND_ENABLED: "true" });
    expect(statusOf(result.results, "proton")).toBe("delivered");
    // The main email is switched on by the same flag and has no recipient here.
    expect(statusOf(result.results, "resend")).toBe("failed");
    expect(result.accepted).toBe(true);
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
    { LIGHTFIELD_API_KEY: "lf_test", LIGHTFIELD_STAGE_LEAD: "opt_lead" },
    { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "false" },
    { LIGHTFIELD_API_KEY: "lf_test", LEAD_LIGHTFIELD_ENABLED: "TRUE" },
  ])("is off for %j", async (env) => {
    const { result, fetchMock } = await run(env);
    expect(statusOf(result.results, "lightfield")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each<[string, LeadEnv, string[]]>([
    ["no key and no stage", {}, ["LIGHTFIELD_API_KEY", "LIGHTFIELD_STAGE_LEAD"]],
    ["no key", { LIGHTFIELD_STAGE_LEAD: "opt_lead" }, ["LIGHTFIELD_API_KEY"]],
    ["no stage", { LIGHTFIELD_API_KEY: "lf_test" }, ["LIGHTFIELD_STAGE_LEAD"]],
    ["a blank stage", { LIGHTFIELD_API_KEY: "lf_test", LIGHTFIELD_STAGE_LEAD: "  " }, ["LIGHTFIELD_STAGE_LEAD"]],
    [
      "a pipeline but no stage",
      { LIGHTFIELD_API_KEY: "lf_test", LIGHTFIELD_PIPELINE_OPTION: "pd_signalhaus" },
      ["LIGHTFIELD_STAGE_LEAD"],
    ],
  ])("fails, without calling Lightfield, when the flag is on with %s", async (_case, env, missing) => {
    const { result, fetchMock } = await run({ ...env, LEAD_LIGHTFIELD_ENABLED: "true" });
    expect(result.results.find((r) => r.sink === "lightfield")).toEqual({
      sink: "lightfield",
      status: "failed",
      error: `Not configured. Missing or invalid: ${missing.join(", ")}`,
    });
    expect(result.accepted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const enabled: LeadEnv = {
    LIGHTFIELD_API_KEY: "lf_test",
    LEAD_LIGHTFIELD_ENABLED: "true",
    LIGHTFIELD_STAGE_LEAD: "opt_lead",
  };

  const STAGES = [
    { id: "opt_lead", label: "Lead", category: "ACTIVE" },
    { id: "opt_won", label: "Won", category: "COMPLETED" },
    { id: "opt_lost", label: "Lost", category: "COMPLETED" },
  ];

  /**
   * A stand-in for the Lightfield API. It answers each list from the records
   * it is given and reads one account by ID. Like the real API it does not
   * promise that a list only holds what the filter asked for.
   */
  function lightfieldFetch(
    existing: {
      contacts?: object[];
      accounts?: Array<{ id: string }>;
      opportunities?: object[];
      definitions?: object;
    },
    /** A call that answers 500, written "POST /v1/accounts". */
    failing?: string
  ) {
    return vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      if (failing === `${method} ${url.pathname}`) return jsonResponse({ error: "boom" }, 500);

      const resource = url.pathname.replace("/v1/", "");
      if (method === "POST") return jsonResponse({ id: `new_${resource}` });
      if (resource === "opportunities/definitions") {
        return jsonResponse(
          existing.definitions ?? {
            objectType: "opportunity",
            fieldDefinitions: { $stage: { typeConfiguration: { options: STAGES } } },
          }
        );
      }
      if (resource.startsWith("accounts/")) {
        const found = existing.accounts?.find((a) => a.id === resource.replace("accounts/", ""));
        return found ? jsonResponse(found) : jsonResponse({ error: "not found" }, 404);
      }
      const data =
        (resource === "contacts"
          ? existing.contacts
          : resource === "accounts"
            ? existing.accounts
            : existing.opportunities) ?? [];
      return jsonResponse({ data, object: "list", totalCount: data.length });
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

  function summary(fetchMock: FetchMock) {
    return calls(fetchMock).map((c) => `${c.method} ${c.path}`);
  }

  /** The body of the one create call made to a path. */
  function created(fetchMock: FetchMock, path: string) {
    const matches = calls(fetchMock).filter((c) => c.method === "POST" && c.path === path);
    expect(matches).toHaveLength(1);
    return matches[0].body;
  }

  function contact(id: string, emails: string[], accountId?: string) {
    return {
      id,
      fields: { $email: { value: emails, valueType: "EMAIL" } },
      relationships: accountId ? { $account: { values: [accountId] } } : {},
    };
  }

  function account(id: string, name: string) {
    return { id, fields: { $name: { value: name, valueType: "TEXT" } } };
  }

  function opportunity(id: string, name: string, stage: string | null) {
    return {
      id,
      fields: {
        $name: { value: name, valueType: "TEXT" },
        $stage: { value: stage, valueType: "SINGLE_SELECT" },
      },
    };
  }

  const HOLDING = "Signalhaus web leads";
  const holding = account("acc_hold", HOLDING);
  const exampleLabs = account("acc_1", "Example Labs");
  /** Already in Lightfield, in an account of her own. */
  const ada = contact("con_ada", ["ada@example.com"], "acc_1");
  /** Already in Lightfield because the form put her in the holding account earlier. */
  const adaInHolding = contact("con_ada", ["ada@example.com"], "acc_hold");

  const NAME = "Signalhaus · Positioning · Example Labs";
  const MARKED_NAME = `${NAME} (email not verified)`;

  describe("a lead whose address is new to Lightfield", () => {
    it("becomes a contact in the holding account, with an opportunity and a note", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("delivered");
      expect(result.accepted).toBe(true);

      const made = calls(fetchMock);
      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts",
        "POST /v1/contacts",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);

      for (const call of made) {
        expect(call.headers.Authorization).toBe("Bearer lf_test");
        expect(call.headers["Lightfield-Version"]).toBe("2026-03-01");
      }
      expect(made.filter((c) => c.method === "POST").map((c) => c.headers["Idempotency-Key"])).toEqual([
        `lead-${makeLead().id}-contact`,
        `lead-${makeLead().id}-opportunity`,
        `lead-${makeLead().id}-note`,
      ]);

      expect(made[0].query).toEqual({
        "$email[contains]": "ada@example.com",
        fields: "$email,$account",
        limit: "25",
      });
      expect(made[2].body).toEqual({
        fields: { $email: ["ada@example.com"], $name: { firstName: "Ada", lastName: "Example" } },
        relationships: { $account: "acc_hold" },
        skipEnrichment: true,
      });
      expect(made[3].body).toEqual({
        fields: { $name: NAME, $stage: "opt_lead" },
        relationships: { $account: "acc_hold" },
      });
      expect(made[4].body.relationships).toEqual({
        $account: "acc_hold",
        $contact: "new_contacts",
        $opportunity: "new_opportunities",
      });
      expect(made[4].body.fields.$title).toBe(NAME);
      expect(made[4].body.fields.$content).toContain("Working out which customer segment");
    });

    it("is not marked as unverified anywhere", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      await run({ ...enabled, LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD: "description" }, fetchMock, [
        lightfieldSink,
      ]);
      for (const call of calls(fetchMock)) {
        expect(JSON.stringify(call.body ?? {}).toLowerCase()).not.toContain("not verified");
      }
    });

    it("does not look for an opportunity to reuse, whatever is in the holding account", async () => {
      const fetchMock = lightfieldFetch({
        accounts: [holding],
        opportunities: [opportunity("opp_someone_else", NAME, "opt_lead")],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("GET /v1/opportunities");
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("new_opportunities");
    });
  });

  describe("the holding account", () => {
    it("is looked up by its exact name, oldest first", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(calls(fetchMock)[1]).toMatchObject({
        method: "GET",
        path: "/v1/accounts",
        query: { "$name[equal]": HOLDING, fields: "$name", sort: "$createdAt", limit: "25" },
      });
    });

    it("is created the first time it is needed, without enrichment", async () => {
      const fetchMock = lightfieldFetch({});
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("delivered");

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts",
        "POST /v1/accounts",
        "POST /v1/contacts",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      const made = calls(fetchMock);
      expect(made[2].body).toEqual({ fields: { $name: HOLDING }, skipEnrichment: true });
      expect(made[2].headers["Idempotency-Key"]).toBe(`lead-${makeLead().id}-account`);
      expect(created(fetchMock, "/v1/contacts").relationships).toEqual({ $account: "new_accounts" });
      expect(created(fetchMock, "/v1/opportunities").relationships).toEqual({ $account: "new_accounts" });
      expect(created(fetchMock, "/v1/notes").relationships.$account).toBe("new_accounts");
    });

    it("is not created again once it exists", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("POST /v1/accounts");
    });

    it("is used whatever company the visitor typed, even one that has an account", async () => {
      const fetchMock = lightfieldFetch({ accounts: [exampleLabs, holding] });
      await run(enabled, fetchMock, [lightfieldSink], makeLead({ company: "Example Labs" }));
      expect(summary(fetchMock)).not.toContain("POST /v1/accounts");
      expect(created(fetchMock, "/v1/contacts").relationships).toEqual({ $account: "acc_hold" });
    });

    it("never gives the visitor's company an account of its own", async () => {
      const fetchMock = lightfieldFetch({});
      await run(enabled, fetchMock, [lightfieldSink], makeLead({ company: "Brand New Co" }));
      expect(created(fetchMock, "/v1/accounts").fields).toEqual({ $name: HOLDING });
    });

    it.each([
      ["a different case", "signalhaus web leads"],
      ["a longer name", "Signalhaus web leads (old)"],
      ["no name at all", undefined],
    ])("is not mistaken for an account with %s", async (_case, name) => {
      const lookalike = name === undefined ? { id: "acc_other" } : account("acc_other", name);
      const fetchMock = lightfieldFetch({ accounts: [lookalike] });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/accounts").fields).toEqual({ $name: HOLDING });
      expect(created(fetchMock, "/v1/contacts").relationships).toEqual({ $account: "new_accounts" });
    });

    it("is the first one returned when two accounts share the name", async () => {
      const fetchMock = lightfieldFetch({ accounts: [account("acc_first", HOLDING), account("acc_second", HOLDING)] });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/contacts").relationships).toEqual({ $account: "acc_first" });
    });

    it("takes its name from LIGHTFIELD_HOLDING_ACCOUNT when that is set", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      await run({ ...enabled, LIGHTFIELD_HOLDING_ACCOUNT: " Inbound from the site " }, fetchMock, [lightfieldSink]);
      expect(calls(fetchMock)[1].query["$name[equal]"]).toBe("Inbound from the site");
      expect(created(fetchMock, "/v1/accounts").fields).toEqual({ $name: "Inbound from the site" });
    });

    it("falls back to the default name when the variable is unset or blank", () => {
      expect(DEFAULT_HOLDING_ACCOUNT).toBe("Signalhaus web leads");
      expect(holdingAccountName({})).toBe(HOLDING);
      expect(holdingAccountName({ LIGHTFIELD_HOLDING_ACCOUNT: "" })).toBe(HOLDING);
      expect(holdingAccountName({ LIGHTFIELD_HOLDING_ACCOUNT: "   " })).toBe(HOLDING);
    });

    it("does not make the sink misconfigured when the variable is unset", () => {
      expect(lightfieldSink.readiness(enabled)).toEqual({ state: "ready" });
    });
  });

  describe("a lead that matches an existing contact by email alone", () => {
    it("is marked in the opportunity name and the note when the contact sits in the holding account", async () => {
      const fetchMock = lightfieldFetch({ contacts: [adaInHolding], accounts: [holding] });
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("delivered");

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_hold",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/opportunities")).toEqual({
        fields: { $name: MARKED_NAME, $stage: "opt_lead" },
        relationships: { $account: "acc_hold" },
      });
      const note = created(fetchMock, "/v1/notes");
      expect(note.fields.$title).toBe(MARKED_NAME);
      expect(note.fields.$content).toMatch(/^\*\*Email not verified\.\*\* /);
      expect(note.fields.$content).toContain("Working out which customer segment");
      expect(note.relationships).toEqual({
        $account: "acc_hold",
        $contact: "con_ada",
        $opportunity: "new_opportunities",
      });
    });

    it("is marked when the contact sits in an account of their own", async () => {
      const fetchMock = lightfieldFetch({ contacts: [ada], accounts: [exampleLabs, holding] });
      await run(enabled, fetchMock, [lightfieldSink]);

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_1",
        "GET /v1/opportunities",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/opportunities")).toEqual({
        fields: { $name: MARKED_NAME, $stage: "opt_lead" },
        relationships: { $account: "acc_1" },
      });
      const note = created(fetchMock, "/v1/notes");
      expect(note.fields.$title).toBe(MARKED_NAME);
      expect(note.fields.$content).toMatch(/^\*\*Email not verified\.\*\* /);
      expect(note.relationships).toEqual({
        $account: "acc_1",
        $contact: "con_ada",
        $opportunity: "new_opportunities",
      });
    });

    it("is marked, and filed in the holding account, when the contact has no account", async () => {
      const fetchMock = lightfieldFetch({ contacts: [contact("con_ada", ["ada@example.com"])], accounts: [holding] });
      await run(enabled, fetchMock, [lightfieldSink]);

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/opportunities")).toEqual({
        fields: { $name: MARKED_NAME, $stage: "opt_lead" },
        relationships: { $account: "acc_hold" },
      });
      expect(created(fetchMock, "/v1/notes").relationships).toEqual({
        $account: "acc_hold",
        $contact: "con_ada",
        $opportunity: "new_opportunities",
      });
    });

    it.each([
      ["in the holding account", { contacts: [adaInHolding], accounts: [holding] }],
      ["in an account of their own", { contacts: [ada], accounts: [exampleLabs, holding] }],
      ["with no account", { contacts: [contact("con_ada", ["ada@example.com"])], accounts: [holding] }],
      [
        "with an open opportunity to reuse",
        { contacts: [ada], accounts: [exampleLabs], opportunities: [opportunity("opp_open", MARKED_NAME, "opt_lead")] },
      ],
    ])("never writes to the existing contact (%s)", async (_case, existing) => {
      const fetchMock = lightfieldFetch(existing);
      await run(enabled, fetchMock, [lightfieldSink], makeLead({ name: "Somebody Else", company: "Another Co" }));
      const writes = calls(fetchMock).filter((c) => c.method === "POST");
      expect(writes.length).toBeGreaterThan(0);
      for (const write of writes) {
        expect(write.path).not.toMatch(/^\/v1\/contacts/);
        expect(write.path).not.toMatch(/^\/v1\/accounts/);
      }
    });

    it("says so at the top of the description field when one is configured", async () => {
      const fetchMock = lightfieldFetch({ contacts: [adaInHolding], accounts: [holding] });
      await run({ ...enabled, LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD: "description" }, fetchMock, [
        lightfieldSink,
      ]);
      const description = created(fetchMock, "/v1/opportunities").fields.description;
      expect(description).toBe(opportunityDescription(makeLead(), true));
      expect(description).toMatch(/^Email not verified\. /);
    });

    it("adds the label to the end of the name, and only when asked", () => {
      expect(EMAIL_NOT_VERIFIED).toBe("email not verified");
      expect(opportunityName(makeLead(), true)).toBe(MARKED_NAME);
      expect(opportunityName(makeLead({ company: "" }), true)).toBe(
        "Signalhaus · Positioning · Ada Example (email not verified)"
      );
      expect(opportunityName(makeLead(), false)).toBe(NAME);
      expect(noteContent(makeLead(), false)).not.toContain("not verified");
      expect(noteContent(makeLead())).toBe(noteContent(makeLead(), false));
      expect(noteContent(makeLead(), true)).toContain(noteContent(makeLead(), false));
    });

    it("reads the contact's account by ID, so a list that lags cannot hide the holding account", async () => {
      // The list would say the holding account does not exist yet.
      const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
        const url = new URL(String(input));
        if ((init?.method ?? "GET") === "POST") return jsonResponse({ id: "new" });
        if (url.pathname === "/v1/contacts") return jsonResponse({ data: [adaInHolding] });
        if (url.pathname === "/v1/accounts/acc_hold") return jsonResponse(holding);
        return jsonResponse({ data: [opportunity("opp_someone_else", NAME, "opt_lead")] });
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_hold",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
    });
  });

  describe("contact lookup", () => {
    it("ignores a contact whose address only contains the submitted one", async () => {
      const lead = makeLead({ email: "ann@acme.co", name: "Ann Lee", company: "Acme" });
      const fetchMock = lightfieldFetch({
        contacts: [
          contact("con_joann", ["joann@acme.com"], "acc_joann"),
          contact("con_ann_uk", ["ann@acme.co.uk"], "acc_uk"),
        ],
        accounts: [holding],
      });
      await run(enabled, fetchMock, [lightfieldSink], lead);

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts",
        "POST /v1/contacts",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/contacts").fields.$email).toEqual(["ann@acme.co"]);
      expect(created(fetchMock, "/v1/opportunities").fields.$name).toBe("Signalhaus · Positioning · Acme");
      expect(created(fetchMock, "/v1/notes").relationships).toEqual({
        $account: "acc_hold",
        $contact: "new_contacts",
        $opportunity: "new_opportunities",
      });
    });

    it("picks the exact match out of several candidates, whatever its position", async () => {
      const lead = makeLead({ email: "ann@acme.co" });
      const fetchMock = lightfieldFetch({
        contacts: [
          contact("con_joann", ["joann@acme.com"], "acc_joann"),
          contact("con_ann", ["other@acme.co", "ann@acme.co"], "acc_ann"),
        ],
        accounts: [account("acc_ann", "Acme")],
      });
      await run(enabled, fetchMock, [lightfieldSink], lead);

      const note = created(fetchMock, "/v1/notes");
      expect(note.relationships.$contact).toBe("con_ann");
      expect(note.relationships.$account).toBe("acc_ann");
    });

    it("matches the address whatever its case", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [contact("con_ada", [" Ada@Example.COM "], "acc_1")],
        accounts: [exampleLabs],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("POST /v1/contacts");
      expect(created(fetchMock, "/v1/notes").relationships.$contact).toBe("con_ada");
    });

    it("reads an email field that holds a single string", async () => {
      const single = { id: "con_one", fields: { $email: { value: "ada@example.com" } } };
      const fetchMock = lightfieldFetch({ contacts: [single], accounts: [holding] });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/notes").relationships.$contact).toBe("con_one");
    });
  });

  describe("opportunity", () => {
    it("names it after the topic and the company, or the person when there is no company", () => {
      expect(opportunityName(makeLead())).toBe(NAME);
      expect(opportunityName(makeLead({ company: "", topic: "due-diligence" }))).toBe(
        "Signalhaus · Due diligence · Ada Example"
      );
    });

    it("describes the source, page, post, topic, UTM values and the message", () => {
      expect(opportunityDescription(makeLead())).toBe(
        [
          "Topic: Positioning",
          "Source: blog-post",
          "Page: /blog/how-to-position-a-startup",
          "Post: how-to-position-a-startup",
          "UTM: source=newsletter, medium=email, campaign=launch",
          "",
          "What they're working on:",
          "Working out which customer segment to go after first.",
        ].join("\n")
      );
    });

    it("leaves out the post and UTM lines when there are none", () => {
      const lead = makeLead();
      const description = opportunityDescription({
        ...lead,
        attribution: { ...lead.attribution, leadSource: "contact", pagePath: "/contact", postSlug: null, utm: {} },
      });
      expect(description).toContain("Source: contact");
      expect(description).not.toContain("Post:");
      expect(description).not.toContain("UTM:");
    });

    it("sets the stage and the pipeline when both are configured", async () => {
      const fetchMock = lightfieldFetch({ accounts: [holding] });
      await run({ ...enabled, LIGHTFIELD_PIPELINE_OPTION: "pd_signalhaus" }, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/opportunities").fields).toEqual({
        $name: NAME,
        $pipeline: "pd_signalhaus",
        $stage: "opt_lead",
      });
    });

    it("sets only the stage when no pipeline is configured", () => {
      expect(stageFields({ LIGHTFIELD_STAGE_LEAD: " opt_lead " })).toEqual({ $stage: "opt_lead" });
      expect(stageFields({ LIGHTFIELD_STAGE_LEAD: "opt_lead", LIGHTFIELD_PIPELINE_OPTION: " " })).toEqual({
        $stage: "opt_lead",
      });
    });

    it("never builds an opportunity without a stage", () => {
      expect(() => stageFields({})).toThrow("LIGHTFIELD_STAGE_LEAD is not set");
      expect(() => stageFields({ LIGHTFIELD_PIPELINE_OPTION: "pd_signalhaus" })).toThrow();
    });

    it("writes the description to the configured field only", async () => {
      const without = lightfieldFetch({ accounts: [holding] });
      await run(enabled, without, [lightfieldSink]);
      expect(Object.keys(created(without, "/v1/opportunities").fields)).toEqual(["$name", "$stage"]);

      const withField = lightfieldFetch({ accounts: [holding] });
      await run({ ...enabled, LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD: "description" }, withField, [
        lightfieldSink,
      ]);
      expect(created(withField, "/v1/opportunities").fields.description).toBe(opportunityDescription(makeLead()));
    });
  });

  describe("reusing an open opportunity on the contact's own account", () => {
    it("adds a marked note to the open Signalhaus opportunity and creates nothing else", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_open", "Signalhaus · Prioritization · Example Labs", "opt_lead")],
      });
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("delivered");

      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_1",
        "GET /v1/opportunities",
        "GET /v1/opportunities/definitions",
        "POST /v1/notes",
      ]);
      const made = calls(fetchMock);
      expect(made[2].query).toEqual({
        $account: "acc_1",
        "$name[startsWith]": "Signalhaus ·",
        fields: "$name,$stage",
        limit: "25",
      });
      expect(made[4].body.relationships).toEqual({
        $account: "acc_1",
        $contact: "con_ada",
        $opportunity: "opp_open",
      });
      expect(made[4].body.fields.$title).toBe(MARKED_NAME);
      expect(made[4].body.fields.$content).toMatch(/^\*\*Email not verified\.\*\* /);
      expect(made[4].headers["Idempotency-Key"]).toBe(`lead-${makeLead().id}-note`);
    });

    it("reuses an opportunity that already carries the label", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_marked", MARKED_NAME, "opt_lead")],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("POST /v1/opportunities");
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("opp_marked");
    });

    it("reuses nothing in the holding account, where the opportunities belong to other people", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [adaInHolding],
        accounts: [holding],
        opportunities: [opportunity("opp_someone_else", NAME, "opt_lead")],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("GET /v1/opportunities");
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("new_opportunities");
    });

    it("treats a custom holding account the same way", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [contact("con_ada", ["ada@example.com"], "acc_inbound")],
        accounts: [account("acc_inbound", "Inbound from the site")],
        opportunities: [opportunity("opp_someone_else", NAME, "opt_lead")],
      });
      await run({ ...enabled, LIGHTFIELD_HOLDING_ACCOUNT: "Inbound from the site" }, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).not.toContain("GET /v1/opportunities");
      expect(created(fetchMock, "/v1/opportunities").relationships).toEqual({ $account: "acc_inbound" });
    });

    it("reuses an opportunity that has no stage without reading the definitions", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_unstaged", NAME, null)],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_1",
        "GET /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("opp_unstaged");
    });

    it("skips won and lost opportunities and takes the newest open one", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [
          opportunity("opp_lost", NAME, "opt_lost"),
          opportunity("opp_open", NAME, "opt_lead"),
          opportunity("opp_older", "Signalhaus · Due diligence · Example Labs", "opt_lead"),
        ],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("opp_open");
    });

    it("creates a new, marked opportunity when every Signalhaus one is closed", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_won", NAME, "opt_won"), opportunity("opp_lost", NAME, "opt_lost")],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_1",
        "GET /v1/opportunities",
        "GET /v1/opportunities/definitions",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
      expect(created(fetchMock, "/v1/opportunities").fields.$name).toBe(MARKED_NAME);
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("new_opportunities");
    });

    it("reads stage options from a response wrapped in a data envelope", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_won", NAME, "opt_won")],
        definitions: { data: { fieldDefinitions: { $stage: { typeConfiguration: { options: STAGES } } } } },
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("new_opportunities");
    });

    it("creates a new opportunity, rather than guess, when Lightfield returns no stage options", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [opportunity("opp_won", NAME, "opt_won")],
        definitions: { objectType: "opportunity" },
      });
      const { result, logger } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("delivered");
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(created(fetchMock, "/v1/notes").relationships.$opportunity).toBe("new_opportunities");
    });

    it("ignores an opportunity without the Signalhaus prefix, even if Lightfield returns it", async () => {
      const fetchMock = lightfieldFetch({
        contacts: [ada],
        accounts: [exampleLabs],
        opportunities: [
          opportunity("opp_other", "Data licence renewal", "opt_lead"),
          opportunity("opp_lookalike", "Signalhaus retainer", "opt_lead"),
        ],
      });
      await run(enabled, fetchMock, [lightfieldSink]);
      expect(summary(fetchMock)).toEqual([
        "GET /v1/contacts",
        "GET /v1/accounts/acc_1",
        "GET /v1/opportunities",
        "POST /v1/opportunities",
        "POST /v1/notes",
      ]);
    });
  });

  describe("when a Lightfield call fails", () => {
    const paths: Array<[string, Parameters<typeof lightfieldFetch>[0], string, string[]]> = [
      ["the contact lookup", {}, "GET /v1/contacts", []],
      ["the holding account lookup", {}, "GET /v1/accounts", []],
      ["creating the holding account", {}, "POST /v1/accounts", []],
      ["creating the contact", { accounts: [holding] }, "POST /v1/contacts", []],
      ["creating the opportunity", { accounts: [holding] }, "POST /v1/opportunities", ["POST /v1/contacts"]],
      [
        "saving the note",
        { accounts: [holding] },
        "POST /v1/notes",
        ["POST /v1/contacts", "POST /v1/opportunities"],
      ],
      [
        "reading a matched contact's account",
        { contacts: [ada], accounts: [exampleLabs] },
        "GET /v1/accounts/acc_1",
        [],
      ],
      [
        "looking for an opportunity to reuse",
        { contacts: [ada], accounts: [exampleLabs] },
        "GET /v1/opportunities",
        [],
      ],
      [
        "reading the stage options",
        { contacts: [ada], accounts: [exampleLabs], opportunities: [opportunity("opp_open", NAME, "opt_lead")] },
        "GET /v1/opportunities/definitions",
        [],
      ],
      [
        "creating a matched contact's opportunity",
        { contacts: [adaInHolding], accounts: [holding] },
        "POST /v1/opportunities",
        [],
      ],
      ["saving a matched contact's note", { contacts: [adaInHolding], accounts: [holding] }, "POST /v1/notes", ["POST /v1/opportunities"]],
    ];

    it.each(paths)(
      "fails the lead at %s, stops there, and does not count as a record",
      async (_step, existing, failing, writesBefore) => {
        const fetchMock = lightfieldFetch(existing, failing);
        const { result } = await run(enabled, fetchMock, [logSink, lightfieldSink]);

        expect(result.results.find((r) => r.sink === "lightfield")).toEqual({
          sink: "lightfield",
          status: "failed",
          error: `Lightfield ${failing} responded with 500`,
        });
        expect(result.accepted).toBe(false);
        expect(result.rejection).toBe("no-record-sink-accepted");

        const made = summary(fetchMock);
        expect(made.at(-1)).toBe(failing);
        expect(made.filter((call) => call.startsWith("POST") && call !== failing)).toEqual(writesBefore);
      }
    );

    it("fails when a matched contact's account can no longer be read", async () => {
      const fetchMock = lightfieldFetch({ contacts: [ada], accounts: [] });
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(result.results[0]).toEqual({
        sink: "lightfield",
        status: "failed",
        error: "Lightfield GET /v1/accounts/acc_1 responded with 404",
      });
      expect(summary(fetchMock).filter((call) => call.startsWith("POST"))).toEqual([]);
    });

    it("fails when a create answers without an ID, rather than file the lead under nothing", async () => {
      const fetchMock = vi.fn<typeof fetch>(async (_input, init) =>
        (init?.method ?? "GET") === "POST" ? jsonResponse({}) : jsonResponse({ data: [] })
      );
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(result.results[0]).toEqual({
        sink: "lightfield",
        status: "failed",
        error: "Lightfield POST /v1/accounts returned no ID",
      });
      expect(summary(fetchMock)).toEqual(["GET /v1/contacts", "GET /v1/accounts", "POST /v1/accounts"]);
      expect(result.accepted).toBe(false);
    });

    it("fails when Lightfield cannot be reached", async () => {
      const fetchMock = vi.fn<typeof fetch>(async () => {
        throw new TypeError("fetch failed");
      });
      const { result } = await run(enabled, fetchMock, [lightfieldSink]);
      expect(statusOf(result.results, "lightfield")).toBe("failed");
      expect(result.accepted).toBe(false);
    });

    it("is still accepted when another record sink takes the lead", async () => {
      const fetchMock = vi.fn<typeof fetch>(async (input) =>
        String(input).includes("api.resend.com") ? jsonResponse({ id: "email_1" }) : jsonResponse({ error: "boom" }, 500)
      );
      const { result } = await run(
        { ...enabled, LEAD_RESEND_ENABLED: "true", RESEND_API_KEY: "re_test", LEAD_NOTIFY_TO: "nathan@example.com" },
        fetchMock,
        [resendSink, lightfieldSink]
      );
      expect(statusOf(result.results, "resend")).toBe("delivered");
      expect(statusOf(result.results, "lightfield")).toBe("failed");
      expect(result.accepted).toBe(true);
    });

    it("keeps the key, the address and the message out of the error and the log", async () => {
      for (const [, existing, failing] of paths) {
        const { result, logger } = await run(enabled, lightfieldFetch(existing, failing), [lightfieldSink]);
        const logged = JSON.stringify([
          result.results,
          logger.error.mock.calls,
          logger.warn.mock.calls,
          logger.info.mock.calls,
        ]);
        expect(logged).toContain("Lightfield");
        for (const secret of ["lf_test", "Bearer", "ada@example.com", "Ada Example", "Example Labs", "customer segment"]) {
          expect(logged).not.toContain(secret);
        }
      }
    });
  });

  it("honours a custom base URL", async () => {
    const fetchMock = lightfieldFetch({});
    await run({ ...enabled, LIGHTFIELD_API_BASE_URL: "https://lf.test/" }, fetchMock, [lightfieldSink]);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/lf\.test\/v1\/contacts\?/);
  });

  describe("deadline", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("has one deadline for the whole run, below the pipeline's", () => {
      expect(LIGHTFIELD_DEADLINE_MS).toBeLessThan(SINK_TIMEOUT_MS);
    });

    it("aborts the request in flight when its own deadline passes", async () => {
      vi.useFakeTimers();
      const fetchMock = hangingFetch();
      const pending = run(enabled, fetchMock, [logSink, lightfieldSink]);

      await vi.advanceTimersByTimeAsync(LIGHTFIELD_DEADLINE_MS - 1);
      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      const { result } = await pending;

      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
      expect(result.results.find((r) => r.sink === "lightfield")).toEqual({
        sink: "lightfield",
        status: "failed",
        error: `Lightfield did not finish within ${LIGHTFIELD_DEADLINE_MS}ms`,
      });
    });

    it("spends one deadline across all its requests, not one each", async () => {
      vi.useFakeTimers();
      const perRequestMs = 3000;
      const slow = vi.fn<typeof fetch>(
        (input, init) =>
          new Promise<Response>((resolve, reject) => {
            const timer = setTimeout(() => {
              const isList = (init?.method ?? "GET") === "GET";
              resolve(jsonResponse(isList ? { data: [] } : { id: `new_${String(input)}` }));
            }, perRequestMs);
            init?.signal?.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(init.signal?.reason);
            });
          })
      );
      const pending = run(enabled, slow, [lightfieldSink]);
      await vi.advanceTimersByTimeAsync(SINK_TIMEOUT_MS);
      const { result } = await pending;

      expect(statusOf(result.results, "lightfield")).toBe("failed");
      expect(slow).toHaveBeenCalledTimes(Math.ceil(LIGHTFIELD_DEADLINE_MS / perRequestMs));
    });
  });
});

describe("slack adapter gating", () => {
  it("is off without the flag, even with a webhook", async () => {
    expect(slackSink.readiness({ SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" })).toEqual({ state: "off" });
    const { result, fetchMock } = await run({ SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" });
    expect(statusOf(result.results, "slack")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when the flag is on and there is no webhook", async () => {
    const { result, fetchMock } = await run({ LEAD_SLACK_ENABLED: "true" });
    expect(result.results.find((r) => r.sink === "slack")).toEqual({
      sink: "slack",
      status: "failed",
      error: "Not configured. Missing or invalid: SLACK_WEBHOOK_URL",
    });
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

describe("which deliveries count", () => {
  const resendOn: LeadEnv = {
    LEAD_RESEND_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    LEAD_NOTIFY_TO: "nathan@example.com",
  };
  const protonOn: LeadEnv = {
    LEAD_RESEND_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    LEAD_PROTON_INBOX: "nathan@proton.me",
  };
  const slackOn: LeadEnv = { LEAD_SLACK_ENABLED: "true", SLACK_WEBHOOK_URL: "https://hooks.slack.test/x" };
  const lightfieldOn: LeadEnv = {
    LIGHTFIELD_API_KEY: "lf_test",
    LEAD_LIGHTFIELD_ENABLED: "true",
    LIGHTFIELD_STAGE_LEAD: "opt_lead",
  };

  function failing(): FetchMock {
    return vi.fn<typeof fetch>(async () => jsonResponse({ message: "nope" }, 500));
  }

  /** Fails every request whose URL contains one of these, and answers the rest. */
  function failingFor(...hosts: string[]): FetchMock {
    return vi.fn<typeof fetch>(async (input) =>
      hosts.some((host) => String(input).includes(host))
        ? jsonResponse({ message: "nope" }, 500)
        : jsonResponse({ id: "ok", data: [] })
    );
  }

  it("treats Resend, the Proton copy and Lightfield as record sinks, and Slack as notify-only", () => {
    expect(Object.fromEntries(defaultSinks.map((sink) => [sink.name, sink.kind]))).toEqual({
      log: "stub",
      resend: "record",
      proton: "record",
      lightfield: "record",
      slack: "notify",
    });
  });

  describe("with no record sink switched on", () => {
    it("is not accepted on the log alone", async () => {
      const { result } = await run({});
      expect(statusOf(result.results, "log")).toBe("delivered");
      expect(result.accepted).toBe(false);
      expect(result.rejection).toBe("no-record-sink-enabled");
    });

    it("is not accepted when Slack delivers", async () => {
      const { result, fetchMock } = await run(slackOn);
      expect(statusOf(result.results, "slack")).toBe("delivered");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result.accepted).toBe(false);
      expect(result.rejection).toBe("no-record-sink-enabled");
    });

    it("is not accepted when keys are present but every switch is off", async () => {
      const { result, fetchMock } = await run({
        RESEND_API_KEY: "re_test",
        LEAD_NOTIFY_TO: "nathan@example.com",
        LEAD_PROTON_INBOX: "nathan@proton.me",
        LIGHTFIELD_API_KEY: "lf_test",
        LIGHTFIELD_STAGE_LEAD: "opt_lead",
        SLACK_WEBHOOK_URL: "https://hooks.slack.test/x",
      });
      expect(result.accepted).toBe(false);
      expect(result.rejection).toBe("no-record-sink-enabled");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("is not accepted by a stub or a notify sink of any kind", async () => {
      const always = (name: string, kind: LeadSink["kind"]): LeadSink => ({
        name,
        kind,
        readiness: () => ({ state: "ready" }),
        deliver: async () => {},
      });
      const result = await runLeadPipeline(makeLead(), {
        sinks: [always("stub", "stub"), always("notify", "notify")],
        env: {},
        logger: silentLogger(),
      });
      expect(result.results.map((r) => r.status)).toEqual(["delivered", "delivered"]);
      expect(result.accepted).toBe(false);
    });
  });

  it.each([
    ["Resend", resendOn],
    ["the Proton copy", protonOn],
    ["Lightfield", lightfieldOn],
  ])("is accepted when %s is the only record sink and it delivers", async (_name, env) => {
    const { result } = await run(env, failingFor());
    expect(result.accepted).toBe(true);
    expect(result.rejection).toBeNull();
  });

  it.each([
    ["Resend", resendOn],
    ["the Proton copy", protonOn],
    ["Lightfield", lightfieldOn],
  ])("is not accepted when %s is the only record sink and it fails", async (_name, env) => {
    const { result, logger } = await run(env, failing());
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-accepted");
    expect(statusOf(result.results, "log")).toBe("delivered");
    expect(logger.error).toHaveBeenCalled();
  });

  it("is not accepted when a record sink throws", async () => {
    const throwing = vi.fn<typeof fetch>(async () => {
      throw new Error("network down");
    });
    const { result } = await run(lightfieldOn, throwing);
    expect(result.accepted).toBe(false);
    expect(result.results.find((r) => r.sink === "lightfield")).toEqual({
      sink: "lightfield",
      status: "failed",
      error: "network down",
    });
  });

  it("is not accepted when the record sink fails and Slack delivers", async () => {
    const { result } = await run({ ...resendOn, ...slackOn }, failingFor("api.resend.com"));
    expect(statusOf(result.results, "resend")).toBe("failed");
    expect(statusOf(result.results, "slack")).toBe("delivered");
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-accepted");
  });

  it("is accepted when the record sink delivers and Slack fails", async () => {
    const { result } = await run({ ...resendOn, ...slackOn }, failingFor("slack"));
    expect(statusOf(result.results, "resend")).toBe("delivered");
    expect(statusOf(result.results, "slack")).toBe("failed");
    expect(result.accepted).toBe(true);
  });

  it("is accepted when one record sink delivers and another fails", async () => {
    const { result } = await run({ ...resendOn, ...lightfieldOn }, failingFor("api.lightfield.app"));
    expect(statusOf(result.results, "resend")).toBe("delivered");
    expect(statusOf(result.results, "lightfield")).toBe("failed");
    expect(result.accepted).toBe(true);
  });

  it("is not accepted when every enabled sink fails", async () => {
    const { result } = await run({ ...resendOn, ...slackOn, ...lightfieldOn }, failing());
    expect(result.accepted).toBe(false);
    for (const sink of ["resend", "slack", "lightfield"]) {
      expect(statusOf(result.results, sink)).toBe("failed");
    }
  });

  it("counts a record sink whose readiness check throws as failed", async () => {
    const broken: LeadSink = {
      name: "broken",
      kind: "record",
      readiness: () => {
        throw new Error("bad config");
      },
      deliver: async () => {},
    };
    const result = await runLeadPipeline(makeLead(), {
      sinks: [logSink, broken],
      env: {},
      logger: silentLogger(),
    });
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-accepted");
  });
});

describe("a sink that is switched on but not configured", () => {
  it("reports off, ready or misconfigured from the switch and what is missing", () => {
    expect(readiness(false, [])).toEqual({ state: "off" });
    expect(readiness(false, ["SOME_KEY"])).toEqual({ state: "off" });
    expect(readiness(true, [])).toEqual({ state: "ready" });
    expect(readiness(true, ["SOME_KEY"])).toEqual({ state: "misconfigured", missing: ["SOME_KEY"] });
  });

  it("counts as failed, not skipped, and is never delivered to", async () => {
    const deliver = vi.fn(async () => {});
    const half: LeadSink = {
      name: "half",
      kind: "record",
      readiness: () => ({ state: "misconfigured", missing: ["HALF_API_KEY"] }),
      deliver,
    };
    const result = await runLeadPipeline(makeLead(), { sinks: [half], env: {}, logger: silentLogger() });

    expect(result.results).toEqual([
      { sink: "half", status: "failed", error: "Not configured. Missing or invalid: HALF_API_KEY" },
    ]);
    expect(deliver).not.toHaveBeenCalled();
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("no-record-sink-accepted");
  });

  it("is logged as a misconfiguration, naming the variables and nothing about the lead", async () => {
    const lead = makeLead({
      name: "Zelda Quartermaine",
      email: "zelda.quartermaine@unusual-domain.example",
      company: "Quartermaine Holdings",
      workingOn: "A very private description of the plan.",
    });
    const env: LeadEnv = {
      LEAD_RESEND_ENABLED: "true",
      RESEND_API_KEY: "re_secret_value",
      LEAD_LIGHTFIELD_ENABLED: "true",
      LIGHTFIELD_API_KEY: "lf_secret_value",
      LEAD_SLACK_ENABLED: "true",
    };
    const { logger, fetchMock } = await run(env, okFetch(), defaultSinks, lead);

    expect(logger.error.mock.calls).toEqual([
      ['[leads] sink "resend" is switched on but not configured', { missing: ["LEAD_NOTIFY_TO"] }],
      ['[leads] sink "lightfield" is switched on but not configured', { missing: ["LIGHTFIELD_STAGE_LEAD"] }],
      ['[leads] sink "slack" is switched on but not configured', { missing: ["SLACK_WEBHOOK_URL"] }],
    ]);
    expect(fetchMock).not.toHaveBeenCalled();

    const everythingLogged = JSON.stringify([
      logger.info.mock.calls,
      logger.warn.mock.calls,
      logger.error.mock.calls,
    ]);
    for (const secret of [
      "Zelda",
      "Quartermaine",
      "zelda.quartermaine",
      "very private description",
      "re_secret_value",
      "lf_secret_value",
    ]) {
      expect(everythingLogged).not.toContain(secret);
    }
  });

  it("does not stop a record sink that is configured from taking the lead", async () => {
    const { result } = await run({
      LEAD_RESEND_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      LEAD_NOTIFY_TO: "nathan@example.com",
      LEAD_LIGHTFIELD_ENABLED: "true",
    });
    expect(statusOf(result.results, "lightfield")).toBe("failed");
    expect(statusOf(result.results, "resend")).toBe("delivered");
    expect(result.accepted).toBe(true);
  });
});

describe("the shared deadline", () => {
  const twoSinks: LeadEnv = {
    LEAD_RESEND_ENABLED: "true",
    RESEND_API_KEY: "re_test",
    LEAD_NOTIFY_TO: "nathan@example.com",
    LEAD_SLACK_ENABLED: "true",
    SLACK_WEBHOOK_URL: "https://hooks.slack.test/x",
  };

  it("gives every sink's request a signal that is live while the pipeline runs", async () => {
    const { fetchMock } = await run(twoSinks);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(init?.signal?.aborted).toBe(false);
    }
  });

  it("aborts every request still in flight at the deadline", async () => {
    const fetchMock = hangingFetch();
    const result = await runLeadPipeline(makeLead(), {
      sinks: defaultSinks,
      env: twoSinks,
      fetch: fetchMock,
      logger: silentLogger(),
      sinkTimeoutMs: 20,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal?.aborted).toBe(true);
    }
    for (const sink of ["resend", "slack"]) {
      expect(result.results.find((r) => r.sink === sink)).toEqual({
        sink,
        status: "failed",
        error: "Timed out after 20ms",
      });
    }
    expect(result.accepted).toBe(false);
  });

  it("keeps a signal the sink passes itself, and still applies the deadline", async () => {
    const own = new AbortController();
    const seen: AbortSignal[] = [];
    const sink: LeadSink = {
      name: "own-signal",
      kind: "record",
      readiness: () => ({ state: "ready" }),
      deliver: async (_lead, ctx) => {
        await ctx.fetch("https://example.test/", { signal: own.signal });
      },
    };
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      if (init?.signal) seen.push(init.signal);
      return jsonResponse({});
    });
    await runLeadPipeline(makeLead(), { sinks: [sink], env: {}, fetch: fetchMock, logger: silentLogger() });

    expect(seen[0].aborted).toBe(false);
    own.abort();
    expect(seen[0].aborted).toBe(true);
  });

  it("gives up on a sink that hangs without using fetch", async () => {
    let signal: AbortSignal | undefined;
    const hanging: LeadSink = {
      name: "hanging",
      kind: "record",
      readiness: () => ({ state: "ready" }),
      deliver: (_lead, ctx) => {
        signal = ctx.signal;
        return new Promise<void>(() => {});
      },
    };
    const result = await runLeadPipeline(makeLead(), {
      sinks: [logSink, hanging],
      env: {},
      logger: silentLogger(),
      sinkTimeoutMs: 10,
    });
    expect(statusOf(result.results, "hanging")).toBe("failed");
    expect(statusOf(result.results, "log")).toBe("delivered");
    expect(signal?.aborted).toBe(true);
  });

  it("does not leave a timer running after the sinks finish", async () => {
    vi.useFakeTimers();
    try {
      await run({});
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
