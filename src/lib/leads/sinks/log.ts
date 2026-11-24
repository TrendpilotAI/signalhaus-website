import type { LeadSink } from "../pipeline";

/**
 * The stub sink. It is always on and only writes the structured lead to the
 * server log, so a submission is never lost while the real adapters are off.
 */
export const logSink: LeadSink = {
  name: "log",
  isEnabled: () => true,
  async deliver(lead, { logger }) {
    logger.info("[leads] new lead", JSON.stringify({ event: "lead.received", lead }));
  },
};
