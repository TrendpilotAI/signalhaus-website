import type { LeadSink } from "../pipeline";
import { lightfieldSink } from "./lightfield";
import { logSink } from "./log";
import { protonSink } from "./proton";
import { resendSink } from "./resend";
import { slackSink } from "./slack";

/**
 * The lead pipeline. The log sink is the only one that is always on.
 * Every other sink is off until its switch is set. A submission only counts
 * once a record sink (Resend, the Proton copy or Lightfield) has it.
 * To add a sink, implement LeadSink and append it here.
 */
export const defaultSinks: readonly LeadSink[] = [
  logSink,
  resendSink,
  protonSink,
  lightfieldSink,
  slackSink,
];

export { lightfieldSink, logSink, protonSink, resendSink, slackSink };
