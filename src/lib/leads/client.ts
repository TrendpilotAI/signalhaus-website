import {
  DELIVERY_FAILED_MESSAGE,
  HONEYPOT_FIELD,
  type LeadAttribution,
  type LeadFieldErrors,
  type LeadTopic,
} from "./schema";

export const LEADS_ENDPOINT = "/api/leads";

export interface LeadFormValues {
  name: string;
  email: string;
  company: string;
  workingOn: string;
  topic: LeadTopic | "";
  /** Honeypot. Stays empty for real visitors. */
  [HONEYPOT_FIELD]: string;
}

export const EMPTY_LEAD_FORM: LeadFormValues = {
  name: "",
  email: "",
  company: "",
  workingOn: "",
  topic: "",
  [HONEYPOT_FIELD]: "",
};

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors: LeadFieldErrors };

const GENERIC_ERROR = "That didn't send. Please try again in a moment.";

export async function submitLead(
  values: LeadFormValues,
  attribution: LeadAttribution,
  fetchImpl: typeof fetch = fetch
): Promise<SubmitLeadResult> {
  let response: Response;
  try {
    response = await fetchImpl(LEADS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, attribution }),
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR, fieldErrors: {} };
  }

  if (response.ok) return { ok: true };

  let payload: { error?: unknown; fieldErrors?: unknown } = {};
  try {
    payload = await response.json();
  } catch {
    // Not JSON. Fall through to the status-based message.
  }

  const fieldErrors =
    typeof payload.fieldErrors === "object" && payload.fieldErrors !== null
      ? (payload.fieldErrors as LeadFieldErrors)
      : {};

  if (response.status === 422) {
    return {
      ok: false,
      message: fieldErrors.form ?? "A couple of things need fixing before this can send.",
      fieldErrors,
    };
  }
  if (response.status === 429) {
    return {
      ok: false,
      message: "That's a few too many tries in a row. Give it a few minutes and try again.",
      fieldErrors: {},
    };
  }
  if (response.status === 413) {
    return { ok: false, message: "That message is too long. Could you shorten it a little?", fieldErrors: {} };
  }
  if (response.status >= 500) {
    return { ok: false, message: DELIVERY_FAILED_MESSAGE, fieldErrors: {} };
  }
  return { ok: false, message: GENERIC_ERROR, fieldErrors: {} };
}
