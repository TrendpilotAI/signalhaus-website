import { leadSummaryRows } from "../email";
import {
  SINK_TIMEOUT_MS,
  isFlagOn,
  readiness,
  type LeadEnv,
  type LeadSink,
  type SinkContext,
} from "../pipeline";
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

/** The one account every contact made by the form goes into, unless the env names another. */
export const DEFAULT_HOLDING_ACCOUNT = "Signalhaus web leads";

/**
 * Added to the opportunity name and the note when a lead's address matches a
 * contact who was already in Lightfield. The form does not check that the
 * sender owns the address, so the match rests on the email alone.
 */
export const EMAIL_NOT_VERIFIED = "email not verified";

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

function splitName(fullName: string): { firstName: string; lastName?: string } {
  const [firstName, ...rest] = fullName.split(" ");
  return rest.length > 0 ? { firstName, lastName: rest.join(" ") } : { firstName };
}

export function holdingAccountName(env: LeadEnv): string {
  return env.LIGHTFIELD_HOLDING_ACCOUNT?.trim() || DEFAULT_HOLDING_ACCOUNT;
}

/**
 * "Signalhaus · Positioning · Example Labs", or the person's name when no
 * company was given. A lead matched to an existing contact by email alone
 * gets " (email not verified)" on the end.
 */
export function opportunityName(lead: Lead, emailNotVerified = false): string {
  const name = `${OPPORTUNITY_PREFIX}${topicLabel(lead.topic)} · ${lead.company || lead.name}`;
  return emailNotVerified ? `${name} (${EMAIL_NOT_VERIFIED})` : name;
}

const NOT_VERIFIED_EXPLAINED =
  "This address matched a contact who was already in Lightfield. The website form does not check that the sender owns the address.";

export function opportunityDescription(lead: Lead, emailNotVerified = false): string {
  const { attribution } = lead;
  const utm = UTM_KEYS.flatMap((key) => (attribution.utm[key] ? [`${key}=${attribution.utm[key]}`] : []));

  return [
    ...(emailNotVerified ? [`Email not verified. ${NOT_VERIFIED_EXPLAINED}`, ""] : []),
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

export function noteContent(lead: Lead, emailNotVerified = false): string {
  return [
    ...(emailNotVerified ? [`**Email not verified.** ${NOT_VERIFIED_EXPLAINED}`, ""] : []),
    "**What they're working on**",
    "",
    lead.workingOn,
    "",
    ...leadSummaryRows(lead).map(([label, value]) => `- **${label}:** ${value}`),
  ].join("\n");
}

/**
 * The stage, and optionally the pipeline, a new opportunity starts in.
 * LIGHTFIELD_STAGE_LEAD is required: the sink counts as misconfigured without
 * it, so that a lead never lands outside the pipeline. A stage option ID picks
 * its pipeline by itself. A stage label alone is looked up in the default
 * pipeline, which is what LIGHTFIELD_PIPELINE_OPTION is for.
 */
export function stageFields(env: LeadEnv): Record<string, string> {
  const stage = env.LIGHTFIELD_STAGE_LEAD?.trim();
  if (!stage) throw new Error("LIGHTFIELD_STAGE_LEAD is not set");

  const pipeline = env.LIGHTFIELD_PIPELINE_OPTION?.trim();
  return pipeline ? { $pipeline: pipeline, $stage: stage } : { $stage: stage };
}

function opportunityFields(lead: Lead, ctx: SinkContext, emailNotVerified: boolean): Record<string, string> {
  const descriptionField = ctx.env.LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD?.trim();
  return {
    $name: opportunityName(lead, emailNotVerified),
    ...stageFields(ctx.env),
    ...(descriptionField ? { [descriptionField]: opportunityDescription(lead, emailNotVerified) } : {}),
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

  async create(path: string, body: unknown, idempotencyKey: string): Promise<LightfieldRecord> {
    const record = await this.request<LightfieldRecord>("POST", path, { body, idempotencyKey });
    // The next record hangs off this ID, so a reply without one is a failure.
    if (typeof record?.id !== "string" || !record.id) {
      throw new Error(`Lightfield POST ${path} returned no ID`);
    }
    return record;
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

function nameOf(account: LightfieldRecord): string | null {
  const value = account.fields?.$name?.value;
  return typeof value === "string" ? value.trim() : null;
}

/**
 * The holding account, found by its exact name. Lightfield does the filtering,
 * and the name is checked again here, so a filter it reads differently can
 * never file web leads under some other account. Oldest first, so that if
 * there are ever two with the name, every lead goes to the same one.
 */
async function findHoldingAccount(client: LightfieldClient, name: string): Promise<LightfieldRecord | null> {
  const candidates = await client.list("/v1/accounts", {
    "$name[equal]": name,
    fields: "$name",
    sort: "$createdAt",
    limit: PAGE_SIZE,
  });
  return candidates.find((account) => nameOf(account) === name) ?? null;
}

async function findOrCreateHoldingAccount(client: LightfieldClient, name: string, lead: Lead): Promise<string> {
  const existing = await findHoldingAccount(client, name);
  if (existing) return existing.id;

  const created = await client.create(
    "/v1/accounts",
    // The holding account is not a company, so there is nothing for enrichment to look up.
    { fields: { $name: name }, skipEnrichment: true },
    `lead-${lead.id}-account`
  );
  return created.id;
}

/**
 * Whether an account a contact already sits in is the holding account. The
 * account is read by ID, not looked up in a list, because a list can lag
 * behind an account that was made a moment ago.
 */
async function isHoldingAccount(client: LightfieldClient, accountId: string, name: string): Promise<boolean> {
  const account = await client.get<LightfieldRecord>(`/v1/accounts/${encodeURIComponent(accountId)}`);
  return nameOf(account) === name;
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
 * Lightfield contact and opportunity upsert. A record sink.
 * Off unless LEAD_LIGHTFIELD_ENABLED is exactly "true". Once it is, it needs
 * LIGHTFIELD_API_KEY and LIGHTFIELD_STAGE_LEAD, and counts as failed without
 * them. Lightfield has no upsert endpoint, so this follows its documented
 * find-or-create pattern and sends an Idempotency-Key with every create.
 *
 * A lead whose address is not in Lightfield becomes a new contact in one
 * holding account ("Signalhaus web leads", or LIGHTFIELD_HOLDING_ACCOUNT),
 * which is found by name and made the first time it is needed. The form never
 * makes an account for the company a visitor typed in.
 *
 * A lead whose address matches an existing contact is filed under that
 * contact, and is marked "email not verified" in the opportunity name and the
 * note, because the match rests on a typed address alone. The contact itself
 * is never written to.
 *
 * A new opportunity is named "Signalhaus · <topic> · <company or name>" and
 * starts in the stage named by LIGHTFIELD_STAGE_LEAD, in the pipeline named by
 * LIGHTFIELD_PIPELINE_OPTION when that is set. Opportunities hang off
 * accounts in Lightfield, not contacts. So a matched contact who sits in an
 * account of their own, with an open Signalhaus opportunity on it, keeps that
 * one and gets the note there. In the holding account the opportunities
 * belong to many different people, so nothing is reused and a matched contact
 * there gets a new opportunity.
 *
 * Existing records are never modified. The lead's own words are attached as a
 * note, so nothing already in the CRM is overwritten by a web form.
 */
export const lightfieldSink: LeadSink = {
  name: "lightfield",
  kind: "record",
  readiness: (env) =>
    readiness(isFlagOn(env.LEAD_LIGHTFIELD_ENABLED), [
      ...(env.LIGHTFIELD_API_KEY ? [] : ["LIGHTFIELD_API_KEY"]),
      ...(env.LIGHTFIELD_STAGE_LEAD?.trim() ? [] : ["LIGHTFIELD_STAGE_LEAD"]),
    ]),
  async deliver(lead, ctx) {
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new Error(`Lightfield did not finish within ${LIGHTFIELD_DEADLINE_MS}ms`)),
      LIGHTFIELD_DEADLINE_MS
    );

    try {
      const client = new LightfieldClient(ctx, deadline.signal);

      const holdingName = holdingAccountName(ctx.env);

      const existingContact = await findContactByEmail(client, lead.email);
      // Anyone can type any address into the form, so a match proves nothing about who sent it.
      const emailNotVerified = existingContact !== null;

      const ownAccountId = existingContact?.relationships?.$account?.values?.[0];
      const inOwnAccount =
        ownAccountId !== undefined && !(await isHoldingAccount(client, ownAccountId, holdingName));

      const accountId = ownAccountId ?? (await findOrCreateHoldingAccount(client, holdingName, lead));

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

      // Only an account of the contact's own can hold an opportunity that is theirs to reuse.
      const openOpportunity = inOwnAccount
        ? await findOpenSignalhausOpportunity(client, accountId, ctx.logger)
        : null;

      const opportunityId =
        openOpportunity?.id ??
        (
          await client.create(
            "/v1/opportunities",
            {
              fields: opportunityFields(lead, ctx, emailNotVerified),
              relationships: { $account: accountId },
            },
            `lead-${lead.id}-opportunity`
          )
        ).id;

      await client.create(
        "/v1/notes",
        {
          fields: {
            $title: opportunityName(lead, emailNotVerified),
            $content: noteContent(lead, emailNotVerified),
          },
          relationships: { $account: accountId, $contact: contactId, $opportunity: opportunityId },
        },
        `lead-${lead.id}-note`
      );
    } finally {
      clearTimeout(timer);
    }
  },
};
