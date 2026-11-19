import { randomUUID } from 'node:crypto';
import { logger } from './logger';

export const PROVIDER_ATTEMPT_TIMEOUT_MS = 120_000;
export const MAX_PROVIDER_RESPONSE_CHARACTERS = 262_144;

export type ProviderUsageSummary = {
  inputTokens: number | null;
  outputTokens: number | null;
};

export type ProviderAttemptTelemetry = {
  requestId?: string;
  provider?: string;
  model?: string;
  operation?: string;
  usageOf?: (result: unknown) => ProviderUsageSummary | null | undefined;
  onEvent?: (event: ProviderAttemptEvent) => void;
};

export type ProviderAttemptEvent = {
  event: 'started' | 'succeeded' | 'failed';
  requestId: string;
  attemptId: string;
  provider?: string;
  model?: string;
  operation?: string;
  startedAt: string;
  timestamp: string;
  durationMs?: number;
  timeoutMs: number;
  usage?: ProviderUsageSummary | null;
  timedOut?: boolean;
  errorName?: string;
  errorCode?: string;
  errorStatus?: number;
};

export class ProviderTimeoutError extends Error {
  readonly code = 'ETIMEDOUT';
  constructor() {
    super('The interpretation provider exceeded its execution deadline.');
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderResponseLimitError extends Error {
  readonly status = 502;
  constructor() {
    super('The interpretation provider exceeded the response size budget.');
    this.name = 'ProviderResponseLimitError';
  }
}

/** Bounds the whole attempt, including obtaining and consuming its stream. */
export async function withProviderDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = PROVIDER_ATTEMPT_TIMEOUT_MS,
  telemetry: ProviderAttemptTelemetry = {},
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('A finite positive provider deadline is required.');
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const base = {
    requestId: telemetry.requestId?.trim() || randomUUID(),
    attemptId: randomUUID(),
    provider: telemetry.provider,
    model: telemetry.model,
    operation: telemetry.operation,
    startedAt,
    timeoutMs,
  };
  const emit = (event: ProviderAttemptEvent['event'], fields: Partial<ProviderAttemptEvent> = {}) => {
    const entry: ProviderAttemptEvent = {
      event,
      ...base,
      timestamp: new Date().toISOString(),
      ...fields,
    };
    try {
      if (event === 'failed') {
        logger.warn(entry, 'AI provider attempt failed');
      } else {
        logger.info(entry, `AI provider attempt ${event}`);
      }
    } catch {
      // Logging failures must never change provider behavior.
    }
    try {
      telemetry.onEvent?.(entry);
    } catch {
      // Diagnostics must never change provider behavior.
    }
  };
  emit('started');

  const controller = new AbortController();
  const deadlineError = new ProviderTimeoutError();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(deadlineError);
      reject(deadlineError);
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([Promise.resolve().then(() => operation(controller.signal)), deadline]);
    let usage: ProviderUsageSummary | null | undefined;
    try {
      usage = telemetry.usageOf?.(result);
    } catch {
      usage = null;
    }
    emit('succeeded', {
      durationMs: Date.now() - startedAtMs,
      usage: usage ?? null,
    });
    return result;
  } catch (cause) {
    controller.abort(cause);
    const error = timedOut ? deadlineError : cause;
    const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
    const response = record.response && typeof record.response === 'object'
      ? record.response as Record<string, unknown>
      : undefined;
    const status = record.status ?? record.statusCode ?? response?.status;
    emit('failed', {
      durationMs: Date.now() - startedAtMs,
      timedOut: timedOut || error instanceof ProviderTimeoutError,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode: typeof record.code === 'string' ? record.code.slice(0, 64) : undefined,
      errorStatus: typeof status === 'number' ? status : undefined,
    });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function appendProviderText(current: string, chunk: string): string {
  if (current.length + chunk.length > MAX_PROVIDER_RESPONSE_CHARACTERS) {
    throw new ProviderResponseLimitError();
  }
  return current + chunk;
}
