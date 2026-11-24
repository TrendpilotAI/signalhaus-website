import { leadSummaryRows } from "../email";
import { isFlagOn, type LeadEnv, type LeadSink, type SinkContext } from "../pipeline";
import { topicLabel, type Lead } from "../schema";

const DEFAULT_BASE_URL = "https://api.lightfield.app";
const DEFAULT_API_VERSION = "2026-03-01";
const REQUEST_TIMEOUT_MS = 8000;

interface LightfieldRecord {
  id: string;
  relationships?: Record<string, { values?: string[] }>;
}

interface LightfieldList {
  data?: LightfieldRecord[];
}

type Query = Record<string, string>;

export function isLightfieldEnabled(env: LeadEnv): boolean {
  return isFlagOn(env.LEAD_LIGHTFIELD_ENABLED) && Boolean(env.LIGHTFIELD_API_KEY);
}

function splitName(fullName: string): { firstName: string; lastName?: string } {
  const [firstName, ...rest] = fullName.split(" ");
  return rest.length > 0 ? { firstName, lastName: rest.join(" ") } : { firstName };
}

export function accountName(lead: Lead): string {
  return lead.company || `${lead.name} (no company given)`;
}

export function opportunityName(lead: Lead): string {
  return `Website lead: ${lead.name} - ${topicLabel(lead.topic)}`;
}

export function noteContent(lead: Lead): string {
  return [
    "**What they're working on**",
    "",
    lead.workingOn,
    "",
    ...leadSummaryRows(lead).map(([label, value]) => `- **${label}:** ${value}`),
  ].join("\n");
}

class LightfieldClient {
  private readonly baseUrl: string;
  private readonly version: string;
  private readonly apiKey: string;

  constructor(private readonly ctx: SinkContext) {
    const apiKey = ctx.env.LIGHTFIELD_API_KEY;
    if (!apiKey) throw new Error("LIGHTFIELD_API_KEY is not set");
    this.apiKey = apiKey;
    this.baseUrl = (ctx.env.LIGHTFIELD_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.version = ctx.env.LIGHTFIELD_API_VERSION || DEFAULT_API_VERSION;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    options: { query?: Query; body?: unknown; idempotencyKey?: string } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Lightfield-Version": this.version,
    };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    const response = await this.ctx.fetch(url.toString(), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Lightfield ${method} ${path} responded with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async findFirst(path: string, query: Query): Promise<LightfieldRecord | null> {
    const list = await this.request<LightfieldList>("GET", path, {
      query: { ...query, limit: "1" },
    });
    return list.data?.[0] ?? null;
  }

  create(path: string, body: unknown, idempotencyKey: string): Promise<LightfieldRecord> {
    return this.request<LightfieldRecord>("POST", path, { body, idempotencyKey });
  }
}

/**
 * Lightfield contact and opportunity upsert.
 * Off unless LEAD_LIGHTFIELD_ENABLED is exactly "true" and LIGHTFIELD_API_KEY
 * is set. Lightfield has no upsert endpoint, so this follows its documented
 * find-or-create pattern and sends an Idempotency-Key with every create.
 *
 * Existing records are never modified. The lead's own words are attached as a
 * note, so nothing already in the CRM is overwritten by a web form.
 */
export const lightfieldSink: LeadSink = {
  name: "lightfield",
  isEnabled: isLightfieldEnabled,
  async deliver(lead, ctx) {
    const client = new LightfieldClient(ctx);

    const existingContact = await client.findFirst("/v1/contacts", {
      "$email[contains]": lead.email,
    });

    const accountId =
      existingContact?.relationships?.$account?.values?.[0] ??
      (await client.findFirst("/v1/accounts", { "$name[equal]": accountName(lead) }))?.id ??
      (
        await client.create(
          "/v1/accounts",
          { fields: { $name: accountName(lead) } },
          `lead-${lead.id}-account`
        )
      ).id;

    const contactId =
      existingContact?.id ??
      (
        await client.create(
          "/v1/contacts",
          {
            fields: { $email: [lead.email], $name: splitName(lead.name) },
            relationships: { $account: accountId },
            // Enrichment is metered, so a web form does not trigger it by default.
            skipEnrichment: !isFlagOn(ctx.env.LEAD_LIGHTFIELD_ENRICH),
          },
          `lead-${lead.id}-contact`
        )
      ).id;

    const name = opportunityName(lead);
    const opportunityId =
      (
        await client.findFirst("/v1/opportunities", {
          "$account[contains]": accountId,
          "$name[equal]": name,
        })
      )?.id ??
      (
        await client.create(
          "/v1/opportunities",
          { fields: { $name: name }, relationships: { $account: accountId } },
          `lead-${lead.id}-opportunity`
        )
      ).id;

    await client.create(
      "/v1/notes",
      {
        fields: { $title: name, $content: noteContent(lead) },
        relationships: { $account: accountId, $contact: contactId, $opportunity: opportunityId },
      },
      `lead-${lead.id}-note`
    );
  },
};
