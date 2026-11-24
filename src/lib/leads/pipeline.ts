import type { Lead } from "./schema";

export type LeadEnv = Readonly<Record<string, string | undefined>>;

export interface LeadLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface SinkContext {
  env: LeadEnv;
  fetch: typeof fetch;
  logger: LeadLogger;
}

export interface LeadSink {
  name: string;
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
  /** True when at least one sink took the lead. */
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

/** A slow sink must not hold the visitor's request open. */
export const SINK_TIMEOUT_MS = 9000;

export interface PipelineOptions {
  sinks: readonly LeadSink[];
  env?: LeadEnv;
  fetch?: typeof fetch;
  logger?: LeadLogger;
  sinkTimeoutMs?: number;
}

/**
 * Runs every enabled sink. One sink failing never stops the others, and never
 * fails the visitor's request as long as another sink took the lead.
 */
export async function runLeadPipeline(lead: Lead, options: PipelineOptions): Promise<PipelineResult> {
  const ctx: SinkContext = {
    env: options.env ?? process.env,
    fetch: options.fetch ?? globalThis.fetch,
    logger: options.logger ?? consoleLogger,
  };

  const results = await Promise.all(
    options.sinks.map(async (sink): Promise<SinkResult> => {
      let enabled = false;
      try {
        enabled = sink.isEnabled(ctx.env);
      } catch (err) {
        return { sink: sink.name, status: "failed", error: errorMessage(err) };
      }
      if (!enabled) return { sink: sink.name, status: "skipped" };

      try {
        await withTimeout(sink.deliver(lead, ctx), options.sinkTimeoutMs ?? SINK_TIMEOUT_MS);
        return { sink: sink.name, status: "delivered" };
      } catch (err) {
        const error = errorMessage(err);
        ctx.logger.error(`[leads] sink "${sink.name}" failed for lead ${lead.id}`, { error });
        return { sink: sink.name, status: "failed", error };
      }
    })
  );

  return { accepted: results.some((r) => r.status === "delivered"), results };
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
