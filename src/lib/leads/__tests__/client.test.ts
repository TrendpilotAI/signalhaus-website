import { describe, expect, it, vi } from "vitest";
import { EMPTY_LEAD_FORM, LEADS_ENDPOINT, submitLead, type LeadFormValues } from "../client";
import { DELIVERY_FAILED_MESSAGE, sanitizeAttribution } from "../schema";
import { jsonResponse } from "./fixtures";

const values: LeadFormValues = {
  ...EMPTY_LEAD_FORM,
  name: "Ada Example",
  email: "ada@example.com",
  workingOn: "Choosing a first customer segment.",
  topic: "positioning",
};
const attribution = sanitizeAttribution({ leadSource: "contact", pagePath: "/contact" });

describe("submitLead", () => {
  it("posts the form values and attribution to the lead route", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ success: true }));

    const result = await submitLead(values, attribution, fetchMock);

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(LEADS_ENDPOINT);
    expect(LEADS_ENDPOINT).toBe("/api/leads");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ ...values, attribution });
  });

  it("always sends the honeypot field so the server can check it", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ success: true }));
    await submitLead(values, attribution, fetchMock);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toHaveProperty("website", "");
  });

  it("returns field errors from a 422", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ error: "Validation failed", fieldErrors: { email: "Bad email" } }, 422)
    );
    const result = await submitLead(values, attribution, fetchMock);
    expect(result).toMatchObject({ ok: false, fieldErrors: { email: "Bad email" } });
  });

  it.each([429, 413, 500])("returns a plain message for a %i", async (status) => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ error: "x" }, status));
    const result = await submitLead(values, attribution, fetchMock);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message.length).toBeGreaterThan(10);
    expect(result.fieldErrors).toEqual({});
  });

  it.each([500, 502, 503])("asks the visitor to try again in a minute after a %i", async (status) => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse({ error: "anything" }, status));
    const result = await submitLead(values, attribution, fetchMock);
    expect(result).toEqual({ ok: false, message: DELIVERY_FAILED_MESSAGE, fieldErrors: {} });
    expect(DELIVERY_FAILED_MESSAGE).toBe("Something went wrong on our end, please try again in a minute.");
  });

  it("handles a network failure and a non-JSON error body", async () => {
    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect((await submitLead(values, attribution, offline)).ok).toBe(false);

    const html = vi.fn<typeof fetch>(async () => new Response("<html>502</html>", { status: 502 }));
    expect((await submitLead(values, attribution, html)).ok).toBe(false);
  });
});
