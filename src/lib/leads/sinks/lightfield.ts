import { leadSummaryRows } from "../email";
import { SINK_TIMEOUT_MS, isFlagOn, type LeadEnv, type LeadSink, type SinkContext } from "../pipeline";
import { UTM_KEYS, topicLabel, type Lead } from "../schema";

const DEFAULT_BASE_URL = "https://api.lightfield.app";
const DEFAULT_API_VERSION = "2026-03-01";

/**
 * One deadline for the whole find-or-create run, not one per request. It sits
 * below the pipeline's own deadline so that a slow run fails with an error
 * that names Lightfield.
 */
export const LIGHTFIELD_DEADLINE_MS = SINK_TIMEOUT_MS - 1000;

/** Lightfield list endpoints return at most 25 records a page. */
const PAGE_SIZE = "25";

/** Every opportunity this site creates starts with this, so they can be found again. */
export const OPPORTUNITY_PREFIX = "Signalhaus · ";

interface LightfieldRecord {
  id: string;
  fields?: Record<string, { value?: unknown } | undefined>;
  relationships?: Record<string, { values?: string[] } | undefined>;
}

interface LightfieldList {
  data?: LightfieldRecord[];
}

interface LightfieldDefinitions {
  fieldDefinitions?: Record<
    string,
    { typeConfiguration?: { options?: Array<{ id: string; category?: string | null }> } } | undefined
  >;
  /** Some Lightfield clients return the definitions inside a `data` envelope. */
  data?: LightfieldDefinitions;
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

/** "Signalhaus · Positioning · Example Labs", or the person's name when no company was given. */
export function opportunityName(lead: Lead): string {
  return `${OPPORTUNITY_PREFIX}${topicLabel(lead.topic)} · ${lead.company || lead.name}`;
}

export function opportunityDescription(lead: Lead): string {
  const { attribution } = lead;
  const utm = UTM_KEYS.flatMap((key) => (attribution.utm[key] ? [`${key}=${attribution.utm[key]}`] : []));

  return [
    `Topic: ${topicLabel(lead.topic)}`,
    `Source: ${attribution.leadSource}`,
    `Page: ${attribution.pagePath}`,
    ...(attribution.postSlug ? [`Post: ${attribution.postSlug}`] : []),
    ...(utm.length > 0 ? [`UTM: ${utm.join(", ")}`] : []),
    "",
    "What they're working on:",
    lead.workingOn,
  ].join("\n");
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

/**
 * The pipeline and stage a new opportunity starts in. Lightfield places a
 * record by its stage and rejects a pipeline sent without one, so
 * LIGHTFIELD_PIPELINE_OPTION is only used together with LIGHTFIELD_STAGE_LEAD.
 * A stage option ID picks its pipeline by itself. A stage label alone is
 * looked up in the default pipeline.
 */
export function stageFields(ctx: Pick<SinkContext, "env" | "logger">): Record<string, string> {
  const stage = ctx.env.LIGHTFIELD_STAGE_LEAD?.trim();
  const pipeline = ctx.env.LIGHTFIELD_PIPELINE_OPTION?.trim();

  if (!stage) {
    if (pipeline) {
      ctx.logger.warn(
        "[leads] LIGHTFIELD_PIPELINE_OPTION is set without LIGHTFIELD_STAGE_LEAD. Lightfield rejects a pipeline without a stage, so the opportunity is created with neither."
      );
    }
    return {};
  }
  return pipeline ? { $pipeline: pipeline, $stage: stage } : { $stage: stage };
}

function opportunityFields(lead: Lead, ctx: SinkContext): Record<string, string> {
  const descriptionField = ctx.env.LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD?.trim();
  return {
    $name: opportunityName(lead),
    ...stageFields(ctx),
    ...(descriptionField ? { [descriptionField]: opportunityDescription(lead) } : {}),
  };
}

class LightfieldClient {
  private readonly baseUrl: string;
  private readonly version: string;
  private readonly apiKey: string;

  constructor(
    private readonly ctx: SinkContext,
    private readonly signal: AbortSignal
  ) {
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
      signal: this.signal,
    });

    if (!response.ok) {
      throw new Error(`Lightfield ${method} ${path} responded with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  async list(path: string, query: Query): Promise<LightfieldRecord[]> {
    const list = await this.request<LightfieldList>("GET", path, { query });
    return list.data ?? [];
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  create(path: string, body: unknown, idempotencyKey: string): Promise<LightfieldRecord> {
    return this.request<LightfieldRecord>("POST", path, { body, idempotencyKey });
  }
}

function emailsOf(contact: LightfieldRecord): string[] {
  const value = contact.fields?.$email?.value;
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((v) => (typeof v === "string" ? [v.trim().toLowerCase()] : []));
}

/**
 * Lightfield can only filter an email field with `contains`, and a search for
 * ann@acme.co also returns joann@acme.com. So the candidates are fetched and
 * the one whose address is the same, ignoring case, is picked here.
 */
async function findContactByEmail(
  client: LightfieldClient,
  email: string
): Promise<LightfieldRecord | null> {
  const wanted = email.trim().toLowerCase();
  const candidates = await client.list("/v1/contacts", {
    "$email[contains]": wanted,
    fields: "$email,$account",
    limit: PAGE_SIZE,
  });
  return candidates.find((contact) => emailsOf(contact).includes(wanted)) ?? null;
}

async function findAccountByName(client: LightfieldClient, name: string): Promise<LightfieldRecord | null> {
  const [account] = await client.list("/v1/accounts", { "$name[equal]": name, limit: "1" });
  return account ?? null;
}

/** The stages Lightfield classes as won or lost, or null when it does not say. */
async function completedStageIds(client: LightfieldClient): Promise<Set<string> | null> {
  const response = await client.get<LightfieldDefinitions>("/v1/opportunities/definitions");
  const definitions = response.fieldDefinitions ?? response.data?.fieldDefinitions;
  const stages = definitions?.$stage?.typeConfiguration?.options;
  if (!stages) return null;
  return new Set(stages.filter((stage) => stage.category === "COMPLETED").map((stage) => stage.id));
}

/**
 * The newest open opportunity on the account that this site created. Open
 * means it has no stage, or a stage Lightfield does not class as completed
 * (won or lost).
 */
async function findOpenSignalhausOpportunity(
  client: LightfieldClient,
  accountId: string,
  logger: SinkContext["logger"]
): Promise<LightfieldRecord | null> {
  const listed = await client.list("/v1/opportunities", {
    $account: accountId,
    "$name[startsWith]": OPPORTUNITY_PREFIX.trim(),
    fields: "$name,$stage",
    limit: PAGE_SIZE,
  });
  // Lightfield ignores a filter it cannot parse, so the prefix is checked again here.
  const candidates = listed.filter((opportunity) => {
    const name = opportunity.fields?.$name?.value;
    return typeof name === "string" && name.startsWith(OPPORTUNITY_PREFIX);
  });
  if (candidates.length === 0) return null;

  const stageOf = (opportunity: LightfieldRecord) => opportunity.fields?.$stage?.value;
  if (candidates.every((opportunity) => !stageOf(opportunity))) return candidates[0];

  const completed = await completedStageIds(client);
  if (!completed) {
    // A second opportunity is easier to tidy up than a lead filed under a lost deal.
    logger.warn(
      "[leads] Lightfield returned no stage options, so an open opportunity cannot be told from a closed one. Creating a new opportunity."
    );
    return null;
  }
  return (
    candidates.find((opportunity) => {
      const stage = stageOf(opportunity);
      return typeof stage !== "string" || !completed.has(stage);
    }) ?? null
  );
}

/**
 * Lightfield contact and opportunity upsert.
 * Off unless LEAD_LIGHTFIELD_ENABLED is exactly "true" and LIGHTFIELD_API_KEY
 * is set. Lightfield has no upsert endpoint, so this follows its documented
 * find-or-create pattern and sends an Idempotency-Key with every create.
 *
 * A new opportunity is named "Signalhaus · <topic> · <company or name>" and
 * starts in the stage and pipeline named by LIGHTFIELD_STAGE_LEAD and
 * LIGHTFIELD_PIPELINE_OPTION. A contact who is already in Lightfield and
 * already has an open Signalhaus opportunity keeps that one. Opportunities
 * hang off accounts in Lightfield, not contacts, so "already has" means one
 * on the contact's account.
 *
 * Existing records are never modified. The lead's own words are attached as a
 * note, so nothing already in the CRM is overwritten by a web form.
 */
export const lightfieldSink: LeadSink = {
  name: "lightfield",
  kind: "real",
  isEnabled: isLightfieldEnabled,
  async deliver(lead, ctx) {
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new Error(`Lightfield did not finish within ${LIGHTFIELD_DEADLINE_MS}ms`)),
      LIGHTFIELD_DEADLINE_MS
    );

    try {
      const client = new LightfieldClient(ctx, deadline.signal);

      const existingContact = await findContactByEmail(client, lead.email);

      const accountId =
        existingContact?.relationships?.$account?.values?.[0] ??
        (await findAccountByName(client, accountName(lead)))?.id ??
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

      // A contact created a moment ago cannot have an opportunity yet.
      const openOpportunity = existingContact
        ? await findOpenSignalhausOpportunity(client, accountId, ctx.logger)
        : null;

      const opportunityId =
        openOpportunity?.id ??
        (
          await client.create(
            "/v1/opportunities",
            { fields: opportunityFields(lead, ctx), relationships: { $account: accountId } },
            `lead-${lead.id}-opportunity`
          )
        ).id;

      await client.create(
        "/v1/notes",
        {
          fields: { $title: opportunityName(lead), $content: noteContent(lead) },
          relationships: { $account: accountId, $contact: contactId, $opportunity: opportunityId },
        },
        `lead-${lead.id}-note`
      );
    } finally {
      clearTimeout(timer);
    }
  },
};
