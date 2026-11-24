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
 * A "real" sink puts the lead in front of a person or into a system of record.
 * A "stub" sink only records that a lead arrived.
 */
export type SinkKind = "real" | "stub";

export interface LeadSink {
  name: string;
  kind: SinkKind;
  /** A sink that is not enabled is skipped and never touches the network. */
  isEnabled(env: LeadEnv): boolean;
  deliver(lead: Lead, ctx: SinkContext): Promise<void>;
}

export type SinkStatus = "delivered" | "skipped" | "failed";

export interface SinkResult {
  sink: string;
  status: SinkStatus;
  error?: string;
}

export interface PipelineResult {
  /**
   * True when the lead reached somebody. With a real sink enabled, that means
   * at least one real sink delivered. With none enabled, the stub is enough.
   */
  accepted: boolean;
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
 * Runs every enabled sink side by side. One sink failing never stops the
 * others. The lead counts as accepted when a real sink delivered it, or when
 * no real sink is enabled and the stub logged it.
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
        let enabled = false;
        try {
          enabled = sink.isEnabled(ctx.env);
        } catch (err) {
          return { ...base, status: "failed", error: errorMessage(err) };
        }
        if (!enabled) return { ...base, status: "skipped" };

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

    const enabledReal = outcomes.filter((o) => o.kind === "real" && o.status !== "skipped");
    const deciding = enabledReal.length > 0 ? enabledReal : outcomes;

    return {
      accepted: deciding.some((o) => o.status === "delivered"),
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
