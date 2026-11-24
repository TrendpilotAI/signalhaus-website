import { isResendEnabled, normaliseRecipient, sendLeadEmail } from "../email";
import type { LeadEnv, LeadSink } from "../pipeline";
import { notifyRecipient } from "./resend";

export function protonRecipient(env: LeadEnv): string | null {
  return normaliseRecipient(env.LEAD_PROTON_INBOX);
}

/**
 * Copies each lead to a Proton inbox.
 * Proton has no inbound API, so the copy goes out over the same Resend
 * transport and sits behind the same LEAD_RESEND_ENABLED switch. It is skipped
 * when the Proton address is already the main notification recipient.
 */
export const protonSink: LeadSink = {
  name: "proton",
  isEnabled(env) {
    const to = protonRecipient(env);
    return isResendEnabled(env) && to !== null && to !== notifyRecipient(env);
  },
  async deliver(lead, ctx) {
    const to = protonRecipient(ctx.env);
    if (!to) throw new Error("No Proton inbox configured");
    await sendLeadEmail(lead, to, ctx);
  },
};
