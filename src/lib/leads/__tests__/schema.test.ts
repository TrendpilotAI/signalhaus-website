import { describe, expect, it } from "vitest";
import {
  HONEYPOT_FIELD,
  LEAD_LIMITS,
  LEAD_TOPIC_VALUES,
  isHoneypotTripped,
  sanitizeAttribution,
  validateLead,
} from "../schema";
import { validBody } from "./fixtures";

describe("validateLead", () => {
  it("accepts a complete submission and normalises it", () => {
    const result = validateLead(
      validBody({ name: "  Ada   Example ", email: " ADA@Example.COM " })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fields.name).toBe("Ada Example");
    expect(result.fields.email).toBe("ada@example.com");
    expect(result.fields.topic).toBe("positioning");
    expect(result.fields.attribution.postSlug).toBe("how-to-position-a-startup");
    expect(result.fields.attribution.utm).toEqual({
      source: "newsletter",
      medium: "email",
      campaign: "launch",
    });
  });

  it("treats company and role as optional", () => {
    const result = validateLead(validBody({ company: "", role: undefined }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fields.company).toBe("");
    expect(result.fields.role).toBe("");
  });

  it.each(LEAD_TOPIC_VALUES)("accepts the topic %s", (topic) => {
    expect(validateLead(validBody({ topic })).ok).toBe(true);
  });

  it("covers the five topics in the brief", () => {
    expect(LEAD_TOPIC_VALUES).toEqual([
      "due-diligence",
      "positioning",
      "prioritization",
      "data-driven-decisions",
      "other",
    ]);
  });

  it("reports every missing required field at once", () => {
    const result = validateLead({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["email", "name", "topic", "workingOn"]);
  });

  it.each([null, undefined, "text", 42, []])("rejects a non-object body: %j", (body) => {
    const result = validateLead(body);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.form).toBeDefined();
  });

  it.each(["not-an-email", "a@b", "a b@example.com", "@example.com", "ada@"])(
    "rejects the email %s",
    (email) => {
      const result = validateLead(validBody({ email }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors.email).toBeDefined();
    }
  );

  it("rejects a topic that is not in the list", () => {
    const result = validateLead(validBody({ topic: "pricing" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.topic).toBeDefined();
  });

  it("rejects a message that is too short or too long", () => {
    const short = validateLead(validBody({ workingOn: "Help" }));
    const long = validateLead(validBody({ workingOn: "a".repeat(LEAD_LIMITS.workingOnMax + 1) }));
    expect(short.ok).toBe(false);
    expect(long.ok).toBe(false);
  });

  it("enforces length limits on the short fields", () => {
    const result = validateLead(
      validBody({
        name: "n".repeat(LEAD_LIMITS.name + 1),
        company: "c".repeat(LEAD_LIMITS.company + 1),
        role: "r".repeat(LEAD_LIMITS.role + 1),
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["company", "name", "role"]);
  });

  it.each([
    ["name", "<script>alert(1)</script>"],
    ["company", "javascript:alert(1)"],
    ["workingOn", 'Here is my pitch <img src=x onerror="alert(1)">'],
    ["role", "<iframe src=//evil.example>"],
    ["workingOn", "<a href=x\nonclick = 'go()'>link</a>"],
  ])("rejects script-like content in %s", (field, value) => {
    const result = validateLead(validBody({ [field]: value }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[field as "name"]).toBeDefined();
  });

  it.each([
    "Our onboarding = 3 weeks and I want it down to one.",
    "Conversion=2% today, and retention = flat since March.",
    "Is 5 < 10 a fair way to say it? Also: button = too small.",
  ])("accepts ordinary text with an equals sign: %s", (workingOn) => {
    expect(validateLead(validBody({ workingOn })).ok).toBe(true);
  });

  it("ignores non-string values instead of throwing", () => {
    const result = validateLead(validBody({ name: { toString: () => "x" }, email: ["a@b.co"] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });

  it("strips control characters", () => {
    const result = validateLead(validBody({ name: "Ada\u0000 Example\u0007" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.fields.name).toBe("Ada Example");
  });
});

describe("isHoneypotTripped", () => {
  it("is false when the hidden field is missing or empty", () => {
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "   " })).toBe(false);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: null })).toBe(false);
  });

  it("is true when the hidden field has any value", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "https://spam.example" })).toBe(true);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: 1 })).toBe(true);
  });

  it("is false for a body that is not an object", () => {
    expect(isHoneypotTripped(null)).toBe(false);
    expect(isHoneypotTripped("website=spam")).toBe(false);
  });
});

describe("sanitizeAttribution", () => {
  it("falls back to safe defaults when nothing is sent", () => {
    expect(sanitizeAttribution(undefined)).toEqual({
      leadSource: "unknown",
      pagePath: "/",
      postSlug: null,
      landingPath: null,
      referrer: null,
      utm: {},
    });
  });

  it("drops bad values without failing the lead", () => {
    const attribution = sanitizeAttribution({
      leadSource: "Not A Source!",
      pagePath: "https://evil.example/path",
      postSlug: "../../etc/passwd",
      landingPath: "//evil.example",
      referrer: "javascript:alert(1)",
      utm: { source: "<script>x</script>", medium: "email", unknown: "ignored" },
    });
    expect(attribution).toEqual({
      leadSource: "unknown",
      pagePath: "/",
      postSlug: null,
      landingPath: null,
      referrer: null,
      utm: { medium: "email" },
    });
  });

  it("truncates long UTM values", () => {
    const attribution = sanitizeAttribution({ utm: { campaign: "c".repeat(500) } });
    expect(attribution.utm.campaign).toHaveLength(LEAD_LIMITS.utm);
  });
});
