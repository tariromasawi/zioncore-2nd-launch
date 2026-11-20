import type { GoogleGenAI } from '@google/genai';
import type { ProviderOutput, ProviderUsage } from './ai-provider-router';
import {
  MAX_ANALYSIS_OUTPUT_TOKENS,
  audioSegmentInsightSchema,
  explanationSchema,
  toGeminiResponseJsonSchema,
} from '@workspace/frequency-ai-contract';
import {
  appendProviderText,
  withProviderDeadline,
  PROVIDER_ATTEMPT_TIMEOUT_MS,
  type ProviderAttemptTelemetry,
} from './provider-execution';

export const GEMINI_ANALYSIS_MODEL = 'gemini-3.8-flash';
export const GOOGLE_GENAI_ANALYSIS_MODEL = 'gemini-3-flash-preview';
export const ZIONCORE_2ND_VERTEX_PROJECT_ID = 'zioncore-2nd-production';
export const ZIONCORE_2ND_VERTEX_LOCATION = 'eu';
export const OPENAI_ANALYSIS_MODEL = 'gpt-5.4-mini';
export const GEMINI_AUDIO_SEGMENT_MAX_OUTPUT_TOKENS = 256;
export const GEMINI_PREFLIGHT_MAX_INPUT_TOKENS = 5_200;
export const GEMINI_PREFLIGHT_SAFETY_MULTIPLIER = 1.25;
export const GEMINI_PREFLIGHT_MAX_ESTIMATED_COST_MICRO_USD = 100_000;
export const GEMINI_ANALYSIS_RESPONSE_JSON_SCHEMA =
  toGeminiResponseJsonSchema(explanationSchema);
export const GEMINI_AUDIO_SEGMENT_RESPONSE_JSON_SCHEMA =
  toGeminiResponseJsonSchema(audioSegmentInsightSchema);

export function buildGeminiJsonGenerationConfig(
  abortSignal: AbortSignal,
  responseJsonSchema: Record<string, unknown>,
  maxOutputTokens: number,
) {
  return {
    abortSignal,
    maxOutputTokens,
    responseMimeType: 'application/json' as const,
    responseJsonSchema,
  };
}

export type AIProviderRequestContext = Pick<
  ProviderAttemptTelemetry,
  'requestId' | 'operation'
>;

export type GeminiCredentialSource =
  'vertex-adc' | 'google-api-key' | 'replit-integration' | 'unconfigured';
export type OpenAICredentialSource =
  'openai-api-key' | 'replit-integration' | 'unconfigured';

export function getGeminiCredentialSource(
  env: NodeJS.ProcessEnv = process.env,
): GeminiCredentialSource {
  if (env.ZIONCORE_2ND_GEMINI_AUTH_MODE?.trim() === 'vertex-adc')
    return 'vertex-adc';
  if (env.GOOGLE_GENAI_API_KEY?.trim()) return 'google-api-key';
  if (
    env.AI_INTEGRATIONS_GEMINI_API_KEY?.trim() &&
    env.AI_INTEGRATIONS_GEMINI_BASE_URL?.trim()
  )
    return 'replit-integration';
  return 'unconfigured';
}

export function isGeminiConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const credentialSource = getGeminiCredentialSource(env);
  if (credentialSource === 'vertex-adc') {
    return (
      env.GOOGLE_CLOUD_PROJECT?.trim() === ZIONCORE_2ND_VERTEX_PROJECT_ID &&
      env.GOOGLE_CLOUD_LOCATION?.trim() === ZIONCORE_2ND_VERTEX_LOCATION
    );
  }
  return credentialSource !== 'unconfigured';
}

export function getOpenAICredentialSource(
  env: NodeJS.ProcessEnv = process.env,
): OpenAICredentialSource {
  if (env.OPENAI_API_KEY?.trim()) return 'openai-api-key';
  if (
    env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() &&
    env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim()
  )
    return 'replit-integration';
  return 'unconfigured';
}

export function isOpenAIConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getOpenAICredentialSource(env) !== 'unconfigured';
}

export function getGeminiAnalysisModel(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return getGeminiCredentialSource(env) === 'google-api-key'
    ? GOOGLE_GENAI_ANALYSIS_MODEL
    : GEMINI_ANALYSIS_MODEL;
}

let geminiClientPromise: Promise<GoogleGenAI> | undefined;

async function getGeminiClient(): Promise<GoogleGenAI> {
  if (!geminiClientPromise) {
    const credentialSource = getGeminiCredentialSource();
    if (credentialSource === 'vertex-adc') {
      const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
      const location = process.env.GOOGLE_CLOUD_LOCATION?.trim();
      if (
        project !== ZIONCORE_2ND_VERTEX_PROJECT_ID ||
        location !== ZIONCORE_2ND_VERTEX_LOCATION
      ) {
        throw new Error(
          `Vertex AI ADC requires GOOGLE_CLOUD_PROJECT=${ZIONCORE_2ND_VERTEX_PROJECT_ID} and GOOGLE_CLOUD_LOCATION=${ZIONCORE_2ND_VERTEX_LOCATION}.`,
        );
      }
      geminiClientPromise = import('@google/genai').then(
        ({ GoogleGenAI: Client }) =>
          new Client({ enterprise: true, project, location }),
      );
    } else if (credentialSource === 'google-api-key') {
      const apiKey = process.env.GOOGLE_GENAI_API_KEY!.trim();
      geminiClientPromise = import('@google/genai').then(
        ({ GoogleGenAI: Client }) => new Client({ apiKey }),
      );
    } else if (credentialSource === 'replit-integration') {
      geminiClientPromise = import('@workspace/integrations-gemini-ai').then(
        ({ ai }) => ai,
      );
    } else {
      throw new Error(
        'Configure Vertex AI ADC, GOOGLE_GENAI_API_KEY, or the Gemini AI integration before using Gemini.',
      );
    }
  }
  return geminiClientPromise;
}

const conservativeStandardRatesUsdPerMillionTokens: Record<
  string,
  { input: number; output: number }
> = {
  // Google lists $0.75/$3.75 per 1M input/output tokens through 2026-12-31,
  // then $1.50/$7.50. Keep $2/$10 as a conservative accounting ceiling.
  // https://cloud.google.com/model-garden/pricing
  [GEMINI_ANALYSIS_MODEL]: { input: 2, output: 10 },
  // Google lists Gemini 3 Flash Preview at $0.50 input / $3.00 output per 1M tokens.
  // https://ai.google.dev/gemini-api/docs/pricing#gemini-3-flash-preview
  [GOOGLE_GENAI_ANALYSIS_MODEL]: { input: 0.5, output: 3 },
  [OPENAI_ANALYSIS_MODEL]: { input: 0.75, output: 4.5 },
};

function normalizeTokenCount(value?: number): number | undefined {
  return Number.isSafeInteger(value) && value! >= 0 ? value : undefined;
}

function normalizeUsage(
  inputTokens?: number,
  outputTokens?: number,
): ProviderUsage {
  return {
    inputTokens: normalizeTokenCount(inputTokens) ?? null,
    outputTokens: normalizeTokenCount(outputTokens) ?? null,
  };
}

export function normalizeGeminiUsage(metadata?: {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  totalTokenCount?: number;
}): ProviderUsage {
  const promptTokens = normalizeTokenCount(metadata?.promptTokenCount);
  const candidatesTokens = normalizeTokenCount(metadata?.candidatesTokenCount);
  const thoughtsTokens = normalizeTokenCount(metadata?.thoughtsTokenCount);
  const toolUsePromptTokens = normalizeTokenCount(metadata?.toolUsePromptTokenCount);
  const reportedTotalTokens = normalizeTokenCount(metadata?.totalTokenCount);
  const outputTokens =
    candidatesTokens === undefined && thoughtsTokens === undefined
      ? undefined
      : (candidatesTokens ?? 0) + (thoughtsTokens ?? 0);
  const inputTokens = promptTokens === undefined && toolUsePromptTokens === undefined
    ? undefined
    : (promptTokens ?? 0) + (toolUsePromptTokens ?? 0);
  const computedTotalTokens =
    promptTokens === undefined &&
    candidatesTokens === undefined &&
    thoughtsTokens === undefined &&
    toolUsePromptTokens === undefined
      ? undefined
      : (promptTokens ?? 0) +
        (candidatesTokens ?? 0) +
        (thoughtsTokens ?? 0) +
        (toolUsePromptTokens ?? 0);
  const safeComputedTotalTokens = normalizeTokenCount(computedTotalTokens);
  const safeInputTokens = normalizeTokenCount(inputTokens);

  return {
    inputTokens: safeInputTokens ?? null,
    outputTokens: Number.isSafeInteger(outputTokens) ? outputTokens! : null,
    candidateTokens: candidatesTokens ?? null,
    reasoningTokens: thoughtsTokens ?? null,
    toolUsePromptTokens: toolUsePromptTokens ?? null,
    reportedTotalTokens: reportedTotalTokens ?? null,
    computedTotalTokens: safeComputedTotalTokens ?? null,
    totalTokensMatchBreakdown:
      reportedTotalTokens === undefined || safeComputedTotalTokens === undefined
        ? null
        : reportedTotalTokens === safeComputedTotalTokens,
  };
}

export type GeminiPreflightAssessment = {
  allowed: boolean;
  rawInputTokens: number | null;
  conservativeInputTokens: number | null;
  estimatedMaxCostMicroUsd: number | null;
  reason: 'allowed' | 'invalid_count' | 'input_limit' | 'estimated_cost_limit';
};

/**
 * CountTokens is only an estimate. The 25% margin exceeds the 14.2% observed
 * undercount, and the fixed input/output cost ceiling fails closed before
 * generation. Neither this check nor a Cloud Billing alert is a provider-side
 * hard spending cap.
 */
export function assessGeminiPreflightBudget(
  rawInputTokens: number | undefined,
): GeminiPreflightAssessment {
  const normalizedInputTokens = normalizeTokenCount(rawInputTokens);
  if (normalizedInputTokens === undefined || normalizedInputTokens === 0) {
    return {
      allowed: false,
      rawInputTokens: null,
      conservativeInputTokens: null,
      estimatedMaxCostMicroUsd: null,
      reason: 'invalid_count',
    };
  }
  const conservativeInputTokens = Math.ceil(
    normalizedInputTokens * GEMINI_PREFLIGHT_SAFETY_MULTIPLIER,
  );
  const estimatedMaxCostMicroUsd = Math.ceil(
    conservativeInputTokens * 2 +
    MAX_ANALYSIS_OUTPUT_TOKENS * 10,
  );
  if (!Number.isSafeInteger(conservativeInputTokens) || !Number.isSafeInteger(estimatedMaxCostMicroUsd)) {
    return {
      allowed: false,
      rawInputTokens: normalizedInputTokens,
      conservativeInputTokens: null,
      estimatedMaxCostMicroUsd: null,
      reason: 'invalid_count',
    };
  }
  if (conservativeInputTokens > GEMINI_PREFLIGHT_MAX_INPUT_TOKENS) {
    return {
      allowed: false,
      rawInputTokens: normalizedInputTokens,
      conservativeInputTokens,
      estimatedMaxCostMicroUsd,
      reason: 'input_limit',
    };
  }
  if (estimatedMaxCostMicroUsd > GEMINI_PREFLIGHT_MAX_ESTIMATED_COST_MICRO_USD) {
    return {
      allowed: false,
      rawInputTokens: normalizedInputTokens,
      conservativeInputTokens,
      estimatedMaxCostMicroUsd,
      reason: 'estimated_cost_limit',
    };
  }
  return {
    allowed: true,
    rawInputTokens: normalizedInputTokens,
    conservativeInputTokens,
    estimatedMaxCostMicroUsd,
    reason: 'allowed',
  };
}

export class GeminiPreflightError extends Error {
  readonly code = 'AI_PREFLIGHT_REJECTED';

  constructor(readonly reason: GeminiPreflightAssessment['reason'] | 'unavailable') {
    super('Gemini request did not pass its non-billable preflight budget check.');
    this.name = 'GeminiPreflightError';
  }
}

export function estimateProviderUsageMicroUsd(
  model: string,
  usage: ProviderUsage | null | undefined,
): number | null {
  const rates = conservativeStandardRatesUsdPerMillionTokens[model];
  if (
    !rates ||
    !usage ||
    typeof usage.inputTokens !== 'number' ||
    typeof usage.outputTokens !== 'number' ||
    !Number.isSafeInteger(usage.inputTokens) ||
    !Number.isSafeInteger(usage.outputTokens) ||
    usage.inputTokens < 0 ||
    usage.outputTokens < 0
  )
    return null;

  const estimate = Math.ceil(
    usage.inputTokens * rates.input + usage.outputTokens * rates.output,
  );
  return Number.isSafeInteger(estimate) ? estimate : null;
}

export function estimateGeminiAudioUsageMicroUsd(
  model: string,
  usage?: ProviderUsage | null,
): number | null {
  if (
    typeof usage?.inputTokens !== 'number' ||
    typeof usage.outputTokens !== 'number'
  )
    return null;

  const rates =
    model === GOOGLE_GENAI_ANALYSIS_MODEL
      ? { input: 1, output: 3 }
      : model === GEMINI_ANALYSIS_MODEL
        ? { input: 2, output: 10 }
        : null;
  if (!rates) return null;

  // Vertex EU pricing for Gemini 3.8 Flash is below this standard-rate ceiling.
  // Using the existing conservative rates avoids understating the audio cost.
  const microUsd =
    usage.inputTokens * rates.input + usage.outputTokens * rates.output;
  return Number.isSafeInteger(microUsd) ? microUsd : null;
}

export async function generateWithGemini(
  prompt: string,
  timeoutMs = PROVIDER_ATTEMPT_TIMEOUT_MS,
  context: AIProviderRequestContext = {},
): Promise<ProviderOutput> {
  const model = getGeminiAnalysisModel();
  return withProviderDeadline(async (signal) => {
    const ai = await getGeminiClient();
    const contents = [{ role: 'user' as const, parts: [{ text: prompt }] }];
    let tokenCount: number | undefined;
    try {
      const counted = await ai.models.countTokens({
        model,
        contents,
        config: {
          abortSignal: signal,
          generationConfig: {
            maxOutputTokens: MAX_ANALYSIS_OUTPUT_TOKENS,
            responseMimeType: 'application/json',
            responseJsonSchema: GEMINI_ANALYSIS_RESPONSE_JSON_SCHEMA,
          },
        },
      });
      tokenCount = counted.totalTokens;
    } catch {
      // A failed or unavailable preflight must never fall through to generation
      // or an automatic paid-provider fallback.
      throw new GeminiPreflightError('unavailable');
    }
    const preflight = assessGeminiPreflightBudget(tokenCount);
    if (!preflight.allowed) throw new GeminiPreflightError(preflight.reason);
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: buildGeminiJsonGenerationConfig(
        signal,
        GEMINI_ANALYSIS_RESPONSE_JSON_SCHEMA,
        MAX_ANALYSIS_OUTPUT_TOKENS,
      ),
    });

    let text = '';
    let usage: ProviderUsage | undefined;
    let finishReason: string | null = null;
    for await (const chunk of stream) {
      text = appendProviderText(text, chunk.text ?? '');
      if (chunk.usageMetadata)
        usage = normalizeGeminiUsage(chunk.usageMetadata);
      const candidateFinishReason = chunk.candidates?.[0]?.finishReason;
      if (candidateFinishReason) finishReason = String(candidateFinishReason);
    }

    return {
      text,
      model,
      usage: usage ?? normalizeGeminiUsage(),
      finishReason,
    };
  }, timeoutMs, {
    ...context,
    provider: 'gemini',
    model,
    operation: context.operation ?? 'text-interpretation',
    usageOf: (result) => {
      const usage = (result as ProviderOutput | null)?.usage;
      return usage ? {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        candidateTokens: usage.candidateTokens,
        reasoningTokens: usage.reasoningTokens,
        toolUsePromptTokens: usage.toolUsePromptTokens,
        reportedTotalTokens: usage.reportedTotalTokens,
        computedTotalTokens: usage.computedTotalTokens,
        totalTokensMatchBreakdown: usage.totalTokensMatchBreakdown,
      } : null;
    },
    finishReasonOf: result => (result as ProviderOutput | null)?.finishReason,
  });
}

export async function generateWithGeminiAudioSegment(
  prompt: string,
  audioBase64: string,
  timeoutMs = 12_000,
  context: AIProviderRequestContext = {},
): Promise<ProviderOutput> {
  const model = getGeminiAnalysisModel();
  return withProviderDeadline(async (signal) => {
    const credentialSource = getGeminiCredentialSource();
    if (
      credentialSource !== 'google-api-key' &&
      credentialSource !== 'vertex-adc'
    ) {
      throw new Error(
        'Direct audio review requires Google GenAI API-key or Vertex AI ADC authentication.',
      );
    }
    const ai = await getGeminiClient();
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
          ],
        },
      ],
      config: buildGeminiJsonGenerationConfig(
        signal,
        GEMINI_AUDIO_SEGMENT_RESPONSE_JSON_SCHEMA,
        GEMINI_AUDIO_SEGMENT_MAX_OUTPUT_TOKENS,
      ),
    });
    return {
      text: response.text ?? '',
      model,
      usage: normalizeGeminiUsage(response.usageMetadata),
      finishReason: response.candidates?.[0]?.finishReason
        ? String(response.candidates[0].finishReason)
        : null,
    };
  }, timeoutMs, {
    ...context,
    provider: 'gemini',
    model,
    operation: context.operation ?? 'audio-interpretation',
    usageOf: (result) => {
      const usage = (result as ProviderOutput | null)?.usage;
      return usage ? {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        candidateTokens: usage.candidateTokens,
        reasoningTokens: usage.reasoningTokens,
        toolUsePromptTokens: usage.toolUsePromptTokens,
        reportedTotalTokens: usage.reportedTotalTokens,
        computedTotalTokens: usage.computedTotalTokens,
        totalTokensMatchBreakdown: usage.totalTokensMatchBreakdown,
      } : null;
    },
    finishReasonOf: result => (result as ProviderOutput | null)?.finishReason,
  });
}

export async function generateWithOpenAI(
  prompt: string,
  timeoutMs = PROVIDER_ATTEMPT_TIMEOUT_MS,
  context: AIProviderRequestContext = {},
): Promise<ProviderOutput> {
  return withProviderDeadline(async (signal) => {
    if (!isOpenAIConfigured()) {
      throw new Error(
        'Configure OPENAI_API_KEY or the OpenAI AI integration before using OpenAI.',
      );
    }
    const { openai } = await import('@workspace/integrations-openai-ai-server');
    const stream = await openai.chat.completions.create(
      {
        model: OPENAI_ANALYSIS_MODEL,
        max_completion_tokens: MAX_ANALYSIS_OUTPUT_TOKENS,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal, timeout: PROVIDER_ATTEMPT_TIMEOUT_MS, maxRetries: 0 },
    );

    let text = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    let finishReason: string | null = null;
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (typeof content === 'string') text = appendProviderText(text, content);
      const candidateFinishReason = chunk.choices[0]?.finish_reason;
      if (candidateFinishReason) finishReason = candidateFinishReason;
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
      }
    }

    return {
      text,
      model: OPENAI_ANALYSIS_MODEL,
      usage: normalizeUsage(inputTokens, outputTokens),
      finishReason,
    };
  }, timeoutMs, {
    ...context,
    provider: 'openai',
    model: OPENAI_ANALYSIS_MODEL,
    operation: context.operation ?? 'text-interpretation',
    usageOf: (result) => {
      const usage = (result as ProviderOutput | null)?.usage;
      return usage ? { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens } : null;
    },
    finishReasonOf: result => (result as ProviderOutput | null)?.finishReason,
  });
}
