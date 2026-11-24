import { UTM_KEYS, type LeadAttribution, type UtmParams } from "./schema";

export const FIRST_TOUCH_STORAGE_KEY = "signalhaus:first-touch";

export interface FirstTouch {
  landingPath: string;
  referrer: string | null;
  utm: UtmParams;
}

export function parseUtm(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const utm: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) utm[key] = value;
  }
  return utm;
}

/** A referrer on the same host says nothing about where the visitor came from. */
export function externalReferrer(referrer: string, currentHost: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.host === currentHost ? null : url.toString();
  } catch {
    return null;
  }
}

export function parseFirstTouch(raw: string | null): FirstTouch | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.landingPath !== "string") return null;
    const utm: UtmParams = {};
    if (typeof record.utm === "object" && record.utm !== null) {
      for (const key of UTM_KEYS) {
        const value = (record.utm as Record<string, unknown>)[key];
        if (typeof value === "string" && value) utm[key] = value;
      }
    }
    return {
      landingPath: record.landingPath,
      referrer: typeof record.referrer === "string" ? record.referrer : null,
      utm,
    };
  } catch {
    return null;
  }
}

export interface PageContext {
  pathname: string;
  search: string;
  referrer: string;
  host: string;
}

export function firstTouchFromPage(page: PageContext): FirstTouch {
  return {
    landingPath: page.pathname,
    referrer: externalReferrer(page.referrer, page.host),
    utm: parseUtm(page.search),
  };
}

export interface AttributionInput {
  leadSource: string;
  postSlug?: string | null;
  page: PageContext;
  firstTouch: FirstTouch | null;
}

/**
 * UTM params on the current URL win. Otherwise the first-touch values from
 * earlier in the visit are used, so a visitor who lands on a post with UTM
 * params and submits from /contact keeps their campaign.
 */
export function buildAttribution(input: AttributionInput): LeadAttribution {
  const current = firstTouchFromPage(input.page);
  const hasCurrentUtm = Object.keys(current.utm).length > 0;

  return {
    leadSource: input.leadSource,
    pagePath: input.page.pathname,
    postSlug: input.postSlug ?? null,
    landingPath: input.firstTouch?.landingPath ?? current.landingPath,
    referrer: input.firstTouch?.referrer ?? current.referrer,
    utm: hasCurrentUtm ? current.utm : (input.firstTouch?.utm ?? {}),
  };
}

function readPage(): PageContext {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    host: window.location.host,
  };
}

function readStoredFirstTouch(): FirstTouch | null {
  try {
    return parseFirstTouch(window.sessionStorage.getItem(FIRST_TOUCH_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Call once per page view. Keeps the first page, referrer and UTM params of the visit. */
export function rememberFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(FIRST_TOUCH_STORAGE_KEY)) return;
    window.sessionStorage.setItem(
      FIRST_TOUCH_STORAGE_KEY,
      JSON.stringify(firstTouchFromPage(readPage()))
    );
  } catch {
    // Storage can be blocked. Attribution then falls back to the current page.
  }
}

export function collectAttribution(leadSource: string, postSlug?: string | null): LeadAttribution {
  return buildAttribution({
    leadSource,
    postSlug,
    page: readPage(),
    firstTouch: readStoredFirstTouch(),
  });
}
