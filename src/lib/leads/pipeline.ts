import type { Lead } from "./schema";

export type LeadEnv = Readonly<Record<string, string | undefined>>;

export interface LeadLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface SinkContext {
  env: LeadEnv;
  /** Every request made through this fetch is aborted at the pipeline's deadline. */
  fetch: typeof fetch;
  logger: LeadLogger;
  /** Aborts at the pipeline's deadline, for work that does not go through `fetch`. */
  signal: AbortSignal;
}

/**
 * A "record" sink keeps the lead where it will be read and can be found again:
 * an inbox or the CRM. Only a record sink can make a submission count.
 * A "notify" sink pings somebody that a lead arrived. It is not where the lead lives.
 * A "stub" sink only notes that a lead arrived, and keeps nothing about the person.
 */
export type SinkKind = "record" | "notify" | "stub";

export type SinkReadiness =
  | { state: "off" }
  | { state: "ready" }
  /** Switched on, but these env vars are missing or not usable. */
  | { state: "misconfigured"; missing: string[] };

/** Off when the switch is off. Otherwise ready, unless something it needs is missing. */
export function readiness(switchedOn: boolean, missing: string[]): SinkReadiness {
  if (!switchedOn) return { state: "off" };
  return missing.length > 0 ? { state: "misconfigured", missing } : { state: "ready" };
}

export interface LeadSink {
  name: string;
  kind: SinkKind;
  /**
   * A sink that is off is skipped and never touches the network. A sink that
   * is switched on without the config it needs counts as failed.
   */
  readiness(env: LeadEnv): SinkReadiness;
  deliver(lead: Lead, ctx: SinkContext): Promise<void>;
}

export type SinkStatus = "delivered" | "skipped" | "failed";

export interface SinkResult {
  sink: string;
  status: SinkStatus;
  error?: string;
}

export type PipelineRejection =
  /** Every record sink is off, so there was nowhere to keep the lead. */
  | "no-record-sink-enabled"
  /** At least one record sink is on, and none of them took the lead. */
  | "no-record-sink-accepted";

export interface PipelineResult {
  /** True only when at least one record sink delivered the lead. */
  accepted: boolean;
  /** Why the lead was not accepted. Null when it was. */
  rejection: PipelineRejection | null;
  results: SinkResult[];
}

/** Feature flags must be exactly "true". "TRUE", "1" and "yes" all count as off. */
export function isFlagOn(value: string | undefined): boolean {
  return value === "true";
}

export const consoleLogger: LeadLogger = {
  info: (message, data) => (data === undefined ? console.log(message) : console.log(message, data)),
  warn: (message, data) => (data === undefined ? console.warn(message) : console.warn(message, data)),
  error: (message, data) =>
    data === undefined ? console.error(message) : console.error(message, data),
};

/**
 * A slow sink must not hold the visitor's request open. Every sink shares
 * this one deadline, and requests still in flight are aborted when it passes.
 */
export const SINK_TIMEOUT_MS = 9000;

export interface PipelineOptions {
  sinks: readonly LeadSink[];
  env?: LeadEnv;
  fetch?: typeof fetch;
  logger?: LeadLogger;
  sinkTimeoutMs?: number;
}

/**
 * Runs every sink that is ready, side by side. One sink failing never stops
 * the others.
 *
 * The pipeline fails closed. The lead counts as accepted only when a record
 * sink delivered it. A notification, or the line in the log, never makes a
 * submission count, and neither does having no record sink switched on.
 */
export async function runLeadPipeline(lead: Lead, options: PipelineOptions): Promise<PipelineResult> {
  const logger = options.logger ?? consoleLogger;
  const baseFetch = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.sinkTimeoutMs ?? SINK_TIMEOUT_MS;

  const deadline = new AbortController();
  const timer = setTimeout(
    () => deadline.abort(new Error(`Timed out after ${timeoutMs}ms`)),
    timeoutMs
  );

  const ctx: SinkContext = {
    env: options.env ?? process.env,
    logger,
    signal: deadline.signal,
    fetch: (input, init) =>
      baseFetch(input, {
        ...init,
        signal: init?.signal ? AbortSignal.any([deadline.signal, init.signal]) : deadline.signal,
      }),
  };

  try {
    const outcomes = await Promise.all(
      options.sinks.map(async (sink): Promise<SinkResult & { kind: SinkKind }> => {
        const base = { sink: sink.name, kind: sink.kind };
        let ready: SinkReadiness;
        try {
          ready = sink.readiness(ctx.env);
        } catch (err) {
          return { ...base, status: "failed", error: errorMessage(err) };
        }
        if (ready.state === "off") return { ...base, status: "skipped" };
        if (ready.state === "misconfigured") {
          // Names of env vars only. Never their values, and nothing about the lead.
          logger.error(`[leads] sink "${sink.name}" is switched on but not configured`, {
            missing: ready.missing,
          });
          return {
            ...base,
            status: "failed",
            error: `Not configured. Missing or invalid: ${ready.missing.join(", ")}`,
          };
        }

        try {
          await untilAborted(sink.deliver(lead, ctx), deadline.signal);
          return { ...base, status: "delivered" };
        } catch (err) {
          const error = errorMessage(err);
          logger.error(`[leads] sink "${sink.name}" failed for lead ${lead.id}`, { error });
          return { ...base, status: "failed", error };
        }
      })
    );

    const record = outcomes.filter((o) => o.kind === "record");
    const accepted = record.some((o) => o.status === "delivered");
    const rejection: PipelineRejection | null = accepted
      ? null
      : record.every((o) => o.status === "skipped")
        ? "no-record-sink-enabled"
        : "no-record-sink-accepted";

    return {
      accepted,
      rejection,
      results: outcomes.map(({ sink, status, error }) =>
        error === undefined ? { sink, status } : { sink, status, error }
      ),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Settles with `work`, or rejects as soon as the signal aborts, whichever is first. */
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
