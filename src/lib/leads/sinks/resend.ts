import { isResendEnabled, normaliseRecipient, sendLeadEmail } from "../email";
import type { LeadEnv, LeadSink } from "../pipeline";

export function notifyRecipient(env: LeadEnv): string | null {
  return normaliseRecipient(env.LEAD_NOTIFY_TO) ?? normaliseRecipient(env.CONTACT_EMAIL);
}

/**
 * Notification email through Resend.
 * Off unless LEAD_RESEND_ENABLED is exactly "true", RESEND_API_KEY is set and
 * there is a recipient in LEAD_NOTIFY_TO (or the older CONTACT_EMAIL).
 */
export const resendSink: LeadSink = {
  name: "resend",
  kind: "real",
  isEnabled: (env) => isResendEnabled(env) && notifyRecipient(env) !== null,
  async deliver(lead, ctx) {
    const to = notifyRecipient(ctx.env);
    if (!to) throw new Error("No notification recipient configured");
    await sendLeadEmail(lead, to, ctx);
  },
};
