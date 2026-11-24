"use client";

import { useEffect } from "react";
import { rememberFirstTouch } from "@/lib/leads/attribution";

/**
 * Remembers the first page, referrer and UTM params of a visit so a lead form
 * filled in a few pages later still knows where the visitor came from.
 * Stored in sessionStorage only. Nothing leaves the browser until a form is sent.
 */
export default function AttributionTracker() {
  useEffect(() => {
    rememberFirstTouch();
  }, []);
  return null;
}
