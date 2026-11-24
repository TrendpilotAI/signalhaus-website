import type { LeadSink } from "../pipeline";
import type { Lead } from "../schema";

/** "jane@acme.com" becomes "j***@acme.com". */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

/**
 * Everything the server log holds about a lead. The name, the message and the
 * full email address stay out of it. The id is a random one made by the lead
 * route, and ties this line to any sink failure logged for the same lead.
 */
export function leadLogEntry(lead: Lead) {
  return {
    event: "lead.received",
    id: lead.id,
    email: maskEmail(lead.email),
    topic: lead.topic,
    source: lead.attribution.leadSource,
    postSlug: lead.attribution.postSlug,
  };
}

/**
 * The stub sink. It is always on and writes one line to the server log to
 * show that a lead arrived. It does not keep the lead itself, so it never
 * makes a submission count. Only a record sink does that.
 */
export const logSink: LeadSink = {
  name: "log",
  kind: "stub",
  readiness: () => ({ state: "ready" }),
  async deliver(lead, { logger }) {
    logger.info("[leads] new lead", JSON.stringify(leadLogEntry(lead)));
  },
};
