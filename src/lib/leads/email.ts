import type { LeadEnv, LeadLogger, SinkContext } from "./pipeline";
import { isFlagOn } from "./pipeline";
import { UTM_KEYS, topicLabel, type Lead } from "./schema";

/**
 * Mail is only ever sent from the dedicated sending subdomain. The root
 * domain's DMARC policy uses strict DKIM alignment, so a root-domain From
 * address would fail.
 */
export const SENDING_DOMAIN = "send.signalhaus.ai";
export const DEFAULT_FROM_ADDRESS = `leads@${SENDING_DOMAIN}`;
export const DEFAULT_FROM = `Signalhaus leads <${DEFAULT_FROM_ADDRESS}>`;

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const ADDRESS_RE = /^[^\s@<>]+@[^\s@<>]+$/;

/** The master switch for anything that sends email through Resend. */
export function isResendEnabled(env: LeadEnv): boolean {
  return isFlagOn(env.LEAD_RESEND_ENABLED) && Boolean(env.RESEND_API_KEY);
}

function bareAddress(from: string): string | null {
  const match = from.match(/<([^<>]+)>\s*$/);
  const address = (match ? match[1] : from).trim().toLowerCase();
  return ADDRESS_RE.test(address) ? address : null;
}

/**
 * Uses LEAD_NOTIFY_FROM only when it is on the sending subdomain. Anything
 * else, including an address on the root domain, falls back to the default.
 */
export function resolveFromAddress(env: LeadEnv, logger?: LeadLogger): string {
  const configured = env.LEAD_NOTIFY_FROM?.trim();
  if (!configured) return DEFAULT_FROM;

  const address = bareAddress(configured);
  if (address && address.endsWith(`@${SENDING_DOMAIN}`)) return configured;

  logger?.warn(
    `[leads] LEAD_NOTIFY_FROM is not an @${SENDING_DOMAIN} address. Using ${DEFAULT_FROM_ADDRESS} instead.`
  );
  return DEFAULT_FROM;
}

export function normaliseRecipient(value: string | undefined): string | null {
  const address = value?.trim().toLowerCase();
  return address && ADDRESS_RE.test(address) ? address : null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function leadSummaryRows(lead: Lead): Array<[label: string, value: string]> {
  const { attribution } = lead;
  const rows: Array<[string, string]> = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company || "Not given"],
    ["Topic", topicLabel(lead.topic)],
    ["Lead source", attribution.leadSource],
    ["Page", attribution.pagePath],
  ];
  if (attribution.postSlug) rows.push(["Post", attribution.postSlug]);
  if (attribution.landingPath) rows.push(["First page", attribution.landingPath]);
  if (attribution.referrer) rows.push(["Referrer", attribution.referrer]);
  for (const key of UTM_KEYS) {
    const value = attribution.utm[key];
    if (value) rows.push([`UTM ${key}`, value]);
  }
  rows.push(["Received", lead.receivedAt], ["Lead ID", lead.id]);
  return rows;
}

export interface LeadEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildLeadEmail(lead: Lead): LeadEmail {
  const rows = leadSummaryRows(lead);
  const subject = `New Signalhaus lead: ${lead.name}${lead.company ? ` (${lead.company})` : ""} - ${topicLabel(lead.topic)}`;

  const text = [
    "What they're working on:",
    lead.workingOn,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const html = [
    "<h2>New lead from the Signalhaus site</h2>",
    "<p><strong>What they're working on</strong></p>",
    `<p>${escapeHtml(lead.workingOn).replace(/\n/g, "<br />")}</p>`,
    "<hr />",
    "<table>",
    ...rows.map(
      ([label, value]) =>
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`
    ),
    "</table>",
  ].join("\n");

  return { subject, html, text };
}

export async function sendLeadEmail(lead: Lead, to: string, ctx: SinkContext): Promise<void> {
  const apiKey = ctx.env.RESEND_API_KEY;
  if (!isResendEnabled(ctx.env) || !apiKey) {
    throw new Error("Resend is not enabled");
  }

  const email = buildLeadEmail(lead);
  const response = await ctx.fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Idempotency-Key": `lead-${lead.id}-${to}`,
    },
    body: JSON.stringify({
      from: resolveFromAddress(ctx.env, ctx.logger),
      to: [to],
      reply_to: lead.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend responded with ${response.status}`);
  }
}
