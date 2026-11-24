import type { LeadSink } from "../pipeline";
import { lightfieldSink } from "./lightfield";
import { logSink } from "./log";
import { protonSink } from "./proton";
import { resendSink } from "./resend";
import { slackSink } from "./slack";

/**
 * The lead pipeline. The log sink is the only one that is always on.
 * Every other sink is a no-op until its env vars are set. To add a sink,
 * implement LeadSink and append it here.
 */
export const defaultSinks: readonly LeadSink[] = [
  logSink,
  resendSink,
  protonSink,
  lightfieldSink,
  slackSink,
];

export { lightfieldSink, logSink, protonSink, resendSink, slackSink };
