"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { IconCheck } from "@/components/icons";
import { trackConversion } from "@/lib/gtag";
import { collectAttribution } from "@/lib/leads/attribution";
import { EMPTY_LEAD_FORM, submitLead, type LeadFormValues, type SubmitLeadResult } from "@/lib/leads/client";
import {
  HONEYPOT_FIELD,
  LEAD_LIMITS,
  LEAD_TOPICS,
  validateLead,
  type LeadFieldErrors,
  type LeadFieldName,
  type LeadTopic,
} from "@/lib/leads/schema";
import { TOOLKIT_URL } from "@/lib/site";

export interface LeadFormProps {
  /** Which form this is, e.g. "landing", "blog-post", "contact". Sent with the lead. */
  source: string;
  /** Blog post slug when the form sits on a post. */
  postSlug?: string;
  /** Pre-selects the topic, e.g. the topic of the post the form sits on. */
  defaultTopic?: LeadTopic;
  submitLabel?: string;
}

type Status = "idle" | "sending" | "sent";

const FIELD_ORDER = ["name", "email", "company", "topic", "workingOn"] as const satisfies readonly LeadFieldName[];

/** Where focus goes after a submission that did not go through. */
export type FailureFocusTarget = Exclude<LeadFieldName, "form"> | "submit";

/**
 * The first field with an error, in the order the fields appear. With no field
 * to fix (the send itself failed), it is the submit button, which sits right
 * under the message and is the way to try again.
 */
export function failureFocusTarget(fieldErrors: LeadFieldErrors): FailureFocusTarget {
  return FIELD_ORDER.find((field) => fieldErrors[field]) ?? "submit";
}

export function focusInForm(form: Pick<HTMLFormElement, "querySelector"> | null, target: FailureFocusTarget) {
  const selector = target === "submit" ? 'button[type="submit"]' : `[name="${target}"]`;
  form?.querySelector<HTMLElement>(selector)?.focus();
}

/**
 * The button is never given the native `disabled` attribute. Disabling a
 * focused button drops focus to the page, which sends a keyboard user back to
 * the top. `aria-disabled` says the same thing and leaves focus where it is.
 * The form ignores a second submit while the first is on its way.
 */
export function LeadSubmitButton({ sending, label }: { sending: boolean; label: string }) {
  return (
    <button
      type="submit"
      className="btn btn-primary flex-none whitespace-nowrap"
      aria-disabled={sending ? true : undefined}
    >
      {sending ? "Sending..." : label}
    </button>
  );
}

/** A ref for an element that should take focus as soon as it is on the page. */
function focusOnMount(node: HTMLElement | null) {
  node?.focus();
}

/**
 * Shown in place of the form once a lead is in. The form, and the button that
 * had focus, are gone by then, so the heading takes focus. That keeps a
 * keyboard user in place and makes a screen reader read the heading out.
 */
export function LeadFormThanks({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="icon-tile">
        <IconCheck />
      </span>
      <h3 ref={focusOnMount} tabIndex={-1} className="h3">
        Thanks{firstName ? `, ${firstName}` : ""}. Your note came through.
      </h3>
      <p>
        If you want something to read in the meantime, the{" "}
        <a href={TOOLKIT_URL} target="_blank" rel="noopener">
          Data-Driven Decision-Making Toolkit
        </a>{" "}
        is free and it&apos;s a good place to start.
      </p>
    </div>
  );
}

export default function LeadForm({
  source,
  postSlug,
  defaultTopic,
  submitLabel = "Send it to Nathan",
}: LeadFormProps) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  // Set and read within one tick, which state is not. Two submits fired back
  // to back would both still see the old status.
  const sendingRef = useRef(false);
  const [values, setValues] = useState<LeadFormValues>({
    ...EMPTY_LEAD_FORM,
    topic: defaultTopic ?? "",
  });
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  // A new object for each failed submission, so two failures in a row both move focus.
  const [focusRequest, setFocusRequest] = useState<{ target: FailureFocusTarget } | null>(null);

  // Runs after the errors are on the page, so the field that takes focus
  // already carries aria-invalid and points at its error text.
  useEffect(() => {
    if (focusRequest) focusInForm(formRef.current, focusRequest.target);
  }, [focusRequest]);

  const id = (field: string) => `${uid}-${field}`;

  function update<K extends keyof LeadFormValues>(field: K, value: LeadFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field as LeadFieldName]) {
      const remaining = { ...errors, [field]: undefined };
      setErrors(remaining);
      // The summary only describes field errors, so it goes when the last one does.
      if (!FIELD_ORDER.some((name) => remaining[name])) setMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The button stays focusable while sending, so this is what stops a second send.
    if (sendingRef.current) return;

    const attribution = collectAttribution(source, postSlug ?? null);

    const check = validateLead({ ...values, attribution });
    if (!check.ok) {
      setErrors(check.errors);
      setMessage("A couple of things need fixing before this can send.");
      setFocusRequest({ target: failureFocusTarget(check.errors) });
      return;
    }

    sendingRef.current = true;
    setStatus("sending");
    setErrors({});
    setMessage(null);

    let result: SubmitLeadResult;
    try {
      result = await submitLead(values, attribution);
    } finally {
      sendingRef.current = false;
    }
    if (result.ok) {
      setStatus("sent");
      trackConversion(`lead_${source}`);
      return;
    }

    setStatus("idle");
    setErrors(result.fieldErrors);
    setMessage(result.message);
    setFocusRequest({ target: failureFocusTarget(result.fieldErrors) });
  }

  if (status === "sent") {
    return <LeadFormThanks firstName={values.name.trim().split(/\s+/)[0] ?? ""} />;
  }

  const describedBy = (field: LeadFieldName) => (errors[field] ? id(`${field}-error`) : undefined);

  const fieldError = (field: LeadFieldName) =>
    errors[field] ? (
      <p id={id(`${field}-error`)} className="field-error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="field-label">
            Your name
          </label>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={LEAD_LIMITS.name}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className="field-input"
          />
          {fieldError("name")}
        </div>
        <div>
          <label htmlFor={id("email")} className="field-label">
            Email
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={LEAD_LIMITS.email}
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            className="field-input"
          />
          {fieldError("email")}
        </div>
        <div>
          <label htmlFor={id("company")} className="field-label">
            Company <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={id("company")}
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={LEAD_LIMITS.company}
            value={values.company}
            onChange={(e) => update("company", e.target.value)}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy("company")}
            className="field-input"
          />
          {fieldError("company")}
        </div>
        <div>
          <label htmlFor={id("topic")} className="field-label">
            What is it mostly about?
          </label>
          <select
            id={id("topic")}
            name="topic"
            required
            value={values.topic}
            onChange={(e) => update("topic", e.target.value as LeadTopic | "")}
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={describedBy("topic")}
            className="field-input field-select"
          >
            <option value="">Pick the closest one</option>
            {LEAD_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          {fieldError("topic")}
        </div>
      </div>

      <div>
        <label htmlFor={id("workingOn")} className="field-label">
          What are you working on?
        </label>
        <p id={id("workingOn-hint")} className="field-hint">
          A few plain sentences is plenty. What you&apos;re building, your role in it, and where
          you&apos;re stuck.
        </p>
        <textarea
          id={id("workingOn")}
          name="workingOn"
          required
          rows={5}
          maxLength={LEAD_LIMITS.workingOnMax}
          value={values.workingOn}
          onChange={(e) => update("workingOn", e.target.value)}
          aria-invalid={errors.workingOn ? true : undefined}
          aria-describedby={[id("workingOn-hint"), describedBy("workingOn")].filter(Boolean).join(" ")}
          className="field-input resize-y"
        />
        {fieldError("workingOn")}
      </div>

      {/* Honeypot. Real visitors never see or reach this field. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={id(HONEYPOT_FIELD)}>Leave this field empty</label>
        <input
          id={id(HONEYPOT_FIELD)}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values[HONEYPOT_FIELD]}
          onChange={(e) => update(HONEYPOT_FIELD, e.target.value)}
        />
      </div>

      {message ? (
        <p role="alert" className="callout">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <LeadSubmitButton sending={status === "sending"} label={submitLabel} />
        <p className="caption">Sending this doesn&apos;t add you to a mailing list.</p>
      </div>
    </form>
  );
}
