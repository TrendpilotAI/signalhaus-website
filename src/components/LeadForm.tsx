"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { IconCheck } from "@/components/icons";
import { trackConversion } from "@/lib/gtag";
import { collectAttribution } from "@/lib/leads/attribution";
import { EMPTY_LEAD_FORM, submitLead, type LeadFormValues } from "@/lib/leads/client";
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

const FIELD_ORDER: LeadFieldName[] = ["name", "email", "company", "topic", "workingOn"];

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
  const [values, setValues] = useState<LeadFormValues>({
    ...EMPTY_LEAD_FORM,
    topic: defaultTopic ?? "",
  });
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

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

  function focusFirstError(fieldErrors: LeadFieldErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const attribution = collectAttribution(source, postSlug ?? null);

    const check = validateLead({ ...values, attribution });
    if (!check.ok) {
      setErrors(check.errors);
      setMessage("A couple of things need fixing before this can send.");
      focusFirstError(check.errors);
      return;
    }

    setStatus("sending");
    setErrors({});
    setMessage(null);

    const result = await submitLead(values, attribution);
    if (result.ok) {
      setStatus("sent");
      trackConversion(`lead_${source}`);
      return;
    }

    setStatus("idle");
    setErrors(result.fieldErrors);
    setMessage(result.message);
    focusFirstError(result.fieldErrors);
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
        <button type="submit" className="btn btn-primary flex-none whitespace-nowrap" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : submitLabel}
        </button>
        <p className="caption">Sending this doesn&apos;t add you to a mailing list.</p>
      </div>
    </form>
  );
}
