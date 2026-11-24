import { normaliseRecipient, sendLeadEmail } from "../email";
import { isFlagOn, readiness, type LeadEnv, type LeadSink } from "../pipeline";
import { notifyRecipient } from "./resend";

export function protonRecipient(env: LeadEnv): string | null {
  return normaliseRecipient(env.LEAD_PROTON_INBOX);
}

/**
 * Copies each lead to a Proton inbox. Like the main email, this is a record sink.
 * Proton has no inbound API, so the copy goes out over the same Resend
 * transport and sits behind the same LEAD_RESEND_ENABLED switch. It is off
 * while LEAD_PROTON_INBOX is empty, and when the Proton address is already the
 * main notification recipient. With the switch on and an inbox given, a
 * missing RESEND_API_KEY or an unusable address counts as failed.
 */
export const protonSink: LeadSink = {
  name: "proton",
  kind: "record",
  readiness(env) {
    const wanted = Boolean(env.LEAD_PROTON_INBOX?.trim());
    const to = protonRecipient(env);
    const duplicate = to !== null && to === notifyRecipient(env);
    return readiness(isFlagOn(env.LEAD_RESEND_ENABLED) && wanted && !duplicate, [
      ...(env.RESEND_API_KEY ? [] : ["RESEND_API_KEY"]),
      ...(to ? [] : ["LEAD_PROTON_INBOX"]),
    ]);
  },
  async deliver(lead, ctx) {
    const to = protonRecipient(ctx.env);
    if (!to) throw new Error("No Proton inbox configured");
    await sendLeadEmail(lead, to, ctx);
  },
};
