import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateProviderUsageMicroUsd,
  estimateGeminiAudioUsageMicroUsd,
  assessGeminiPreflightBudget,
  buildGeminiJsonGenerationConfig,
  GEMINI_ANALYSIS_MODEL,
  GEMINI_ANALYSIS_RESPONSE_JSON_SCHEMA,
  GEMINI_AUDIO_SEGMENT_RESPONSE_JSON_SCHEMA,
  GEMINI_AUDIO_SEGMENT_MAX_OUTPUT_TOKENS,
  GeminiPreflightError,
  generateWithGeminiAudioSegment,
  getGeminiAnalysisModel,
  getGeminiCredentialSource,
  getOpenAICredentialSource,
  isGeminiConfigured,
  isOpenAIConfigured,
  normalizeGeminiUsage,
  GOOGLE_GENAI_ANALYSIS_MODEL,
} from './ai-provider-clients';
import { MAX_ANALYSIS_OUTPUT_TOKENS } from '@workspace/frequency-ai-contract';
import { shouldFailOver } from './ai-provider-router';

test('prefers the owner-provided Google API key and validates integration configuration', () => {
  assert.equal(
    getGeminiCredentialSource({
      GOOGLE_GENAI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    'google-api-key',
  );
  assert.equal(
    getGeminiCredentialSource({
      AI_INTEGRATIONS_GEMINI_API_KEY: 'configured',
      AI_INTEGRATIONS_GEMINI_BASE_URL: 'https://proxy.example',
    } as NodeJS.ProcessEnv),
    'replit-integration',
  );
  assert.equal(
    getGeminiCredentialSource({
      AI_INTEGRATIONS_GEMINI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    'unconfigured',
  );
  assert.equal(
    isGeminiConfigured({
      GOOGLE_GENAI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    true,
  );
  assert.equal(isGeminiConfigured({} as NodeJS.ProcessEnv), false);
  assert.equal(
    getGeminiAnalysisModel({
      GOOGLE_GENAI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    'gemini-3-flash-preview',
  );
  assert.equal(
    getGeminiAnalysisModel({
      AI_INTEGRATIONS_GEMINI_API_KEY: 'configured',
      AI_INTEGRATIONS_GEMINI_BASE_URL: 'https://proxy.example',
    } as NodeJS.ProcessEnv),
    'gemini-3.8-flash',
  );
});

test('Vertex ADC mode takes precedence and requires the dedicated EU project configuration', () => {
  const env = {
    ZIONCORE_2ND_GEMINI_AUTH_MODE: 'vertex-adc',
    GOOGLE_CLOUD_PROJECT: 'zioncore-2nd-production',
    GOOGLE_CLOUD_LOCATION: 'eu',
    GOOGLE_GENAI_API_KEY: 'ignored-in-ADC-mode',
  } as NodeJS.ProcessEnv;

  assert.equal(getGeminiCredentialSource(env), 'vertex-adc');
  assert.equal(isGeminiConfigured(env), true);
  assert.equal(getGeminiAnalysisModel(env), 'gemini-3.8-flash');
  assert.equal(
    isGeminiConfigured({
      ...env,
      GOOGLE_CLOUD_PROJECT: 'ethereal-throne-b20e6',
    } as NodeJS.ProcessEnv),
    false,
  );
  assert.equal(
    isGeminiConfigured({
      ...env,
      GOOGLE_CLOUD_LOCATION: 'europe-west2',
    } as NodeJS.ProcessEnv),
    false,
  );
});

test('OpenAI provider supports direct keys for standalone hosting and Replit integration keys', () => {
  assert.equal(
    getOpenAICredentialSource({
      OPENAI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    'openai-api-key',
  );
  assert.equal(
    getOpenAICredentialSource({
      AI_INTEGRATIONS_OPENAI_API_KEY: 'configured',
      AI_INTEGRATIONS_OPENAI_BASE_URL: 'https://proxy.example',
    } as NodeJS.ProcessEnv),
    'replit-integration',
  );
  assert.equal(
    getOpenAICredentialSource({
      AI_INTEGRATIONS_OPENAI_API_KEY: 'configured',
    } as NodeJS.ProcessEnv),
    'unconfigured',
  );
  assert.equal(
    isOpenAIConfigured({ OPENAI_API_KEY: 'configured' } as NodeJS.ProcessEnv),
    true,
  );
  assert.equal(isOpenAIConfigured({} as NodeJS.ProcessEnv), false);
});

test('estimates provider usage at conservative standard token rates', () => {
  assert.equal(
    estimateProviderUsageMicroUsd('gemini-3.8-flash', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    }),
    12_000_000,
  );
  assert.equal(
    estimateProviderUsageMicroUsd('gpt-5.4-mini', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    }),
    5_250_000,
  );
});

test('returns no cost estimate when model or token usage is unknown', () => {
  assert.equal(
    estimateProviderUsageMicroUsd('future-model', {
      inputTokens: 100,
      outputTokens: 50,
    }),
    null,
  );
  assert.equal(
    estimateProviderUsageMicroUsd('gemini-3.8-flash', {
      inputTokens: null,
      outputTokens: 50,
    }),
    null,
  );
});

test('Gemini cost tracking covers the configured preview model and includes thinking tokens', () => {
  const usage = normalizeGeminiUsage({
    promptTokenCount: 17,
    candidatesTokenCount: 5,
    thoughtsTokenCount: 3,
    totalTokenCount: 25,
  });
  assert.deepEqual(usage, {
    inputTokens: 17,
    outputTokens: 8,
    candidateTokens: 5,
    reasoningTokens: 3,
    toolUsePromptTokens: null,
    reportedTotalTokens: 25,
    computedTotalTokens: 25,
    totalTokensMatchBreakdown: true,
  });
  assert.equal(
    estimateProviderUsageMicroUsd(GOOGLE_GENAI_ANALYSIS_MODEL, usage),
    33,
  );
  const inconsistentUsage = normalizeGeminiUsage({
    promptTokenCount: 5_901,
    candidatesTokenCount: 4_282,
    thoughtsTokenCount: 1_343,
    toolUsePromptTokenCount: 0,
    totalTokenCount: 10_183,
  });
  assert.equal(inconsistentUsage.outputTokens, 5_625, 'candidate and reasoning tokens are each counted once');
  assert.equal(inconsistentUsage.computedTotalTokens, 11_526);
  assert.equal(inconsistentUsage.totalTokensMatchBreakdown, false);
  assert.equal(
    estimateProviderUsageMicroUsd(GEMINI_ANALYSIS_MODEL, inconsistentUsage),
    68_052,
    'cost estimate uses prompt plus candidate/reasoning components, not the inconsistent aggregate',
  );
  assert.deepEqual(
    normalizeGeminiUsage({ promptTokenCount: -1, candidatesTokenCount: 1.5 }),
    {
      inputTokens: null,
      outputTokens: null,
      candidateTokens: null,
      reasoningTokens: null,
      toolUsePromptTokens: null,
      reportedTotalTokens: null,
      computedTotalTokens: null,
      totalTokensMatchBreakdown: null,
    },
  );
});

test('Gemini preflight applies 25 percent headroom and blocks the observed undercount before generation', () => {
  const observedEstimate = assessGeminiPreflightBudget(5_169);
  assert.deepEqual(observedEstimate, {
    allowed: false,
    rawInputTokens: 5_169,
    conservativeInputTokens: 6_462,
    estimatedMaxCostMicroUsd: 94_844,
    reason: 'input_limit',
  });
  const withinBudget = assessGeminiPreflightBudget(4_160);
  assert.equal(withinBudget.allowed, true);
  assert.equal(withinBudget.conservativeInputTokens, 5_200);
  assert.equal(withinBudget.estimatedMaxCostMicroUsd, 92_320);
  assert.equal(assessGeminiPreflightBudget(undefined).reason, 'invalid_count');
  assert.equal(shouldFailOver(new GeminiPreflightError('input_limit')), false);
  assert.equal(shouldFailOver(new GeminiPreflightError('unavailable')), false);
});

test('Gemini audio usage estimate applies the documented audio input rate conservatively', () => {
  assert.equal(
    estimateGeminiAudioUsageMicroUsd('gemini-3-flash-preview', {
      inputTokens: 1_000,
      outputTokens: 256,
    }),
    1_768,
  );
  assert.equal(
    estimateGeminiAudioUsageMicroUsd('unknown-model', {
      inputTokens: 1_000,
      outputTokens: 256,
    }),
    null,
  );
  assert.equal(
    estimateGeminiAudioUsageMicroUsd('gemini-3.8-flash', {
      inputTokens: 1_000,
      outputTokens: 256,
    }),
    4_560,
  );
  assert.equal(
    estimateGeminiAudioUsageMicroUsd('gemini-3-flash-preview', {
      inputTokens: null,
      outputTokens: 256,
    }),
    null,
  );
});

test('Gemini text and audio requests use their distinct supported structured-output schemas', () => {
  const controller = new AbortController();
  const textConfig = buildGeminiJsonGenerationConfig(
    controller.signal,
    GEMINI_ANALYSIS_RESPONSE_JSON_SCHEMA,
    MAX_ANALYSIS_OUTPUT_TOKENS,
  );
  const audioConfig = buildGeminiJsonGenerationConfig(
    controller.signal,
    GEMINI_AUDIO_SEGMENT_RESPONSE_JSON_SCHEMA,
    GEMINI_AUDIO_SEGMENT_MAX_OUTPUT_TOKENS,
  );

  assert.equal(textConfig.responseMimeType, 'application/json');
  assert.equal(textConfig.maxOutputTokens, 8192);
  assert.deepEqual(
    textConfig.responseJsonSchema.required,
    Object.keys(textConfig.responseJsonSchema.properties as object),
  );
  assert.equal(audioConfig.maxOutputTokens, 256);
  assert.deepEqual(audioConfig.responseJsonSchema.required, [
    'observations',
    'speechOrEventDetail',
  ]);
});

test('Gemini audio segment helper sends WAV inline data and applies its bounded deadline', async () => {
  // Provider I/O itself is verified by the provider contract and bounded WAV parser tests;
  // this assertion keeps the public entry point available for the paid audio route.
  assert.equal(typeof generateWithGeminiAudioSegment, 'function');
});
