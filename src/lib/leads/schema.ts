export const LEAD_TOPICS = [
  { value: "due-diligence", label: "Due diligence" },
  { value: "positioning", label: "Positioning" },
  { value: "prioritization", label: "Prioritization" },
  { value: "data-driven-decisions", label: "Data-driven decisions" },
  { value: "other", label: "Something else" },
] as const;

export type LeadTopic = (typeof LEAD_TOPICS)[number]["value"];

export const LEAD_TOPIC_VALUES: readonly LeadTopic[] = LEAD_TOPICS.map((t) => t.value);

export function isLeadTopic(value: unknown): value is LeadTopic {
  return typeof value === "string" && (LEAD_TOPIC_VALUES as readonly string[]).includes(value);
}

export function topicLabel(topic: LeadTopic): string {
  return LEAD_TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

/**
 * Hidden form field that real visitors never see or fill in.
 * Any value in it marks the submission as automated.
 */
export const HONEYPOT_FIELD = "website";

/** Shown when the lead could not be handed to anyone. The form keeps what was typed. */
export const DELIVERY_FAILED_MESSAGE = "Something went wrong on our end, please try again in a minute.";

export const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

export interface LeadAttribution {
  /** Which form the lead came from, e.g. "landing", "blog-post", "contact". */
  leadSource: string;
  /** Path of the page the form was submitted from. */
  pagePath: string;
  /** Blog post slug when the form sat on a post. */
  postSlug: string | null;
  /** First page of the visit, when known. */
  landingPath: string | null;
  /** Where the visitor came from before the site, when known. */
  referrer: string | null;
  utm: UtmParams;
}

export interface LeadFields {
  name: string;
  email: string;
  company: string;
  workingOn: string;
  topic: LeadTopic;
  attribution: LeadAttribution;
}

export interface Lead extends LeadFields {
  id: string;
  receivedAt: string;
}

export type LeadFieldName = "name" | "email" | "company" | "workingOn" | "topic" | "form";
export type LeadFieldErrors = Partial<Record<LeadFieldName, string>>;

export type LeadValidationResult =
  | { ok: true; fields: LeadFields }
  | { ok: false; errors: LeadFieldErrors };

export const LEAD_LIMITS = {
  name: 100,
  email: 254,
  company: 200,
  workingOnMin: 10,
  workingOnMax: 5000,
  path: 300,
  slug: 120,
  referrer: 500,
  utm: 150,
  leadSource: 60,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// An inline handler only counts inside a tag, so "onboarding = 3 weeks" is fine.
const BLOCKED_PATTERNS = [/<script/i, /javascript:/i, /<[^>]*\son\w+\s*=/i, /<iframe/i];
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEAD_SOURCE_RE = /^[a-z0-9]+(?:[-_:][a-z0-9]+)*$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.replace(CONTROL_CHARS, "").trim() : "";
}

function cleanSingleLine(value: unknown): string {
  return cleanString(value).replace(/\s+/g, " ");
}

function hasBlockedContent(value: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(value));
}

export function isHoneypotTripped(body: unknown): boolean {
  const record = asRecord(body);
  if (!record) return false;
  const value = record[HONEYPOT_FIELD];
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

function sanitizePath(value: unknown): string | null {
  const path = cleanSingleLine(value);
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path.length > LEAD_LIMITS.path || hasBlockedContent(path)) return null;
  return path;
}

function sanitizeReferrer(value: unknown): string | null {
  const referrer = cleanSingleLine(value);
  if (!referrer || referrer.length > LEAD_LIMITS.referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function sanitizeUtm(value: unknown): UtmParams {
  const record = asRecord(value);
  const utm: UtmParams = {};
  if (!record) return utm;
  for (const key of UTM_KEYS) {
    const cleaned = cleanSingleLine(record[key]).slice(0, LEAD_LIMITS.utm);
    if (cleaned && !hasBlockedContent(cleaned)) utm[key] = cleaned;
  }
  return utm;
}

/**
 * Attribution is captured automatically in the browser, so bad values are
 * dropped instead of failing the whole submission.
 */
export function sanitizeAttribution(value: unknown): LeadAttribution {
  const record = asRecord(value) ?? {};

  const leadSource = cleanSingleLine(record.leadSource).toLowerCase();
  const postSlug = cleanSingleLine(record.postSlug).toLowerCase();

  return {
    leadSource:
      leadSource.length <= LEAD_LIMITS.leadSource && LEAD_SOURCE_RE.test(leadSource)
        ? leadSource
        : "unknown",
    pagePath: sanitizePath(record.pagePath) ?? "/",
    postSlug: postSlug.length <= LEAD_LIMITS.slug && SLUG_RE.test(postSlug) ? postSlug : null,
    landingPath: sanitizePath(record.landingPath),
    referrer: sanitizeReferrer(record.referrer),
    utm: sanitizeUtm(record.utm),
  };
}

export function validateLead(body: unknown): LeadValidationResult {
  const record = asRecord(body);
  if (!record) {
    return { ok: false, errors: { form: "Send the form fields as a JSON object." } };
  }

  const errors: LeadFieldErrors = {};

  const name = cleanSingleLine(record.name);
  if (!name) errors.name = "Tell me your name.";
  else if (name.length > LEAD_LIMITS.name) errors.name = `Keep your name under ${LEAD_LIMITS.name} characters.`;

  const email = cleanSingleLine(record.email).toLowerCase();
  if (!email) errors.email = "I need an email address to reply to.";
  else if (email.length > LEAD_LIMITS.email || !EMAIL_RE.test(email)) {
    errors.email = "That email address doesn't look right.";
  }

  const company = cleanSingleLine(record.company);
  if (company.length > LEAD_LIMITS.company) {
    errors.company = `Keep the company name under ${LEAD_LIMITS.company} characters.`;
  }

  const workingOn = cleanString(record.workingOn);
  if (!workingOn) errors.workingOn = "Tell me a little about what you're working on.";
  else if (workingOn.length < LEAD_LIMITS.workingOnMin) {
    errors.workingOn = "A sentence or two is enough, but I need a bit more than that.";
  } else if (workingOn.length > LEAD_LIMITS.workingOnMax) {
    errors.workingOn = `Keep it under ${LEAD_LIMITS.workingOnMax} characters.`;
  }

  const topic = cleanSingleLine(record.topic);
  if (!topic) errors.topic = "Pick the topic that's closest.";
  else if (!isLeadTopic(topic)) errors.topic = "Pick one of the topics in the list.";

  const textFields: Array<[LeadFieldName, string]> = [
    ["name", name],
    ["email", email],
    ["company", company],
    ["workingOn", workingOn],
  ];
  for (const [field, value] of textFields) {
    if (!errors[field] && hasBlockedContent(value)) {
      errors[field] = "That contains something I can't accept. Plain text only, please.";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    fields: {
      name,
      email,
      company,
      workingOn,
      topic: topic as LeadTopic,
      attribution: sanitizeAttribution(record.attribution),
    },
  };
}
