import { normaliseRecipient, sendLeadEmail } from "../email";
import { isFlagOn, readiness, type LeadEnv, type LeadSink } from "../pipeline";

export function notifyRecipient(env: LeadEnv): string | null {
  return normaliseRecipient(env.LEAD_NOTIFY_TO) ?? normaliseRecipient(env.CONTACT_EMAIL);
}

/**
 * Notification email through Resend. This is a record sink: the email in the
 * inbox is the lead.
 * Off unless LEAD_RESEND_ENABLED is exactly "true". Once it is, it needs
 * RESEND_API_KEY and a recipient in LEAD_NOTIFY_TO (or the older
 * CONTACT_EMAIL). Switched on without them, it counts as failed.
 */
export const resendSink: LeadSink = {
  name: "resend",
  kind: "record",
  readiness: (env) =>
    readiness(isFlagOn(env.LEAD_RESEND_ENABLED), [
      ...(env.RESEND_API_KEY ? [] : ["RESEND_API_KEY"]),
      ...(notifyRecipient(env) ? [] : ["LEAD_NOTIFY_TO"]),
    ]),
  async deliver(lead, ctx) {
    const to = notifyRecipient(ctx.env);
    if (!to) throw new Error("No notification recipient configured");
    await sendLeadEmail(lead, to, ctx);
  },
};
