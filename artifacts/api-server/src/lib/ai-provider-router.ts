import {
  ProviderOutputValidationError,
  type ProviderOutputFailureCategory,
} from './provider-output-validation';

export type AIProvider = 'gemini' | 'openai';

export type ProviderUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
};

export type ProviderOutput = {
  text: string;
  model: string;
  usage?: ProviderUsage;
  finishReason?: string | null;
};

export type ProviderCalls = Record<AIProvider, () => Promise<ProviderOutput>>;

export type ProviderAttempt = {
  provider: AIProvider;
  model: string;
  usage: ProviderUsage | null;
  finishReason: string | null;
  outputStatus: 'valid' | 'invalid';
  validationFailure?: ProviderOutputFailureCategory | 'validation_error';
};

export type RoutedInterpretation<T> = {
  analysis: T;
  provider: AIProvider;
  model: string;
  fallbackUsed: boolean;
  usage?: ProviderUsage;
  attempts: ProviderAttempt[];
};

export class AIProvidersUnavailableError extends Error {
  constructor(readonly attempts: ProviderAttempt[] = []) {
    super('Neither AI provider returned a valid interpretation.');
    this.name = 'AIProvidersUnavailableError';
  }
}

export function shouldFailOver(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as Record<string, unknown>;
  const response = record.response && typeof record.response === 'object'
    ? record.response as Record<string, unknown>
    : null;
  const statusValue = record.status ?? record.statusCode ?? response?.status;
  const status = typeof statusValue === 'number' ? statusValue : Number(statusValue);

  if (Number.isFinite(status)) {
    return status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;
  }

  const code = String(record.code ?? '').toUpperCase();
  const name = String(record.name ?? '').toLowerCase();
  const message = String(record.message ?? '');
  return [
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ECONNREFUSED',
    'UND_ERR_CONNECT_TIMEOUT',
  ].includes(code) ||
    name.includes('timeout') ||
    name.includes('connection') ||
    /AI_INTEGRATIONS_(GEMINI|OPENAI)_(BASE_URL|API_KEY) must be set/i.test(message);
}

export async function runWithGeminiOpenAIFallback<T>(
  providers: ProviderCalls,
  validate: (text: string, output: ProviderOutput) => T,
): Promise<RoutedInterpretation<T>> {
  const attempts: ProviderAttempt[] = [];
  try {
    const primary = await providers.gemini();
    const attempt: ProviderAttempt = {
      provider: 'gemini',
      model: primary.model,
      usage: primary.usage ?? null,
      finishReason: safeFinishReason(primary.finishReason),
      outputStatus: 'invalid',
    };
    attempts.push(attempt);
    try {
      const analysis = validate(primary.text, primary);
      attempt.outputStatus = 'valid';
      return {
        analysis,
        provider: 'gemini',
        model: primary.model,
        fallbackUsed: false,
        usage: primary.usage,
        attempts,
      };
    } catch (error) {
      attempt.validationFailure = error instanceof ProviderOutputValidationError
        ? error.category
        : 'validation_error';
      // Malformed or schema-invalid output is a provider failure; make one bounded fallback call.
    }
  } catch (error) {
    if (!shouldFailOver(error)) throw error;
  }

  try {
    const fallback = await providers.openai();
    const attempt: ProviderAttempt = {
      provider: 'openai',
      model: fallback.model,
      usage: fallback.usage ?? null,
      finishReason: safeFinishReason(fallback.finishReason),
      outputStatus: 'invalid',
    };
    attempts.push(attempt);
    const analysis = validate(fallback.text, fallback);
    attempt.outputStatus = 'valid';
    return {
      analysis,
      provider: 'openai',
      model: fallback.model,
      fallbackUsed: true,
      usage: fallback.usage,
      attempts,
    };
  } catch (error) {
    const attempt = attempts.at(-1);
    if (attempt && !attempt.validationFailure) {
      attempt.validationFailure = error instanceof ProviderOutputValidationError
        ? error.category
        : 'validation_error';
    }
    throw new AIProvidersUnavailableError(attempts);
  }
}

function safeFinishReason(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,48}$/.test(value)
    ? value
    : null;
}
