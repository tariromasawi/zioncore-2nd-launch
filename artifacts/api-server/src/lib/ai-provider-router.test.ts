import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AIProvidersUnavailableError,
  runWithGeminiOpenAIFallback,
  shouldFailOver,
  type ProviderCalls,
} from './ai-provider-router';
import { parseProviderJsonOutput } from './provider-output-validation';

const validText = '{"value":"validated"}';
const validate = (text: string) => {
  const parsed = JSON.parse(text) as { value?: unknown };
  if (typeof parsed.value !== 'string') throw new Error('Invalid output shape.');
  return { value: parsed.value };
};

test('uses Gemini alone when its response validates', async () => {
  let openAICalls = 0;
  const result = await runWithGeminiOpenAIFallback({
    gemini: async () => ({ text: validText, model: 'gemini-test' }),
    openai: async () => {
      openAICalls += 1;
      return { text: validText, model: 'openai-test' };
    },
  }, validate);

  assert.equal(result.provider, 'gemini');
  assert.equal(result.fallbackUsed, false);
  assert.equal(openAICalls, 0);
  assert.deepEqual(result.attempts.map(attempt => attempt.provider), ['gemini']);
  assert.equal(result.attempts[0]?.outputStatus, 'valid');
});

test('uses OpenAI once after a retryable Gemini failure', async () => {
  let openAICalls = 0;
  const providers: ProviderCalls = {
    gemini: async () => { throw Object.assign(new Error('Unavailable'), { status: 503 }); },
    openai: async () => {
      openAICalls += 1;
      return { text: validText, model: 'openai-test' };
    },
  };

  const result = await runWithGeminiOpenAIFallback(providers, validate);
  assert.equal(result.provider, 'openai');
  assert.equal(result.fallbackUsed, true);
  assert.equal(openAICalls, 1);
});

test('uses OpenAI once when Gemini returns invalid JSON', async () => {
  const result = await runWithGeminiOpenAIFallback({
    gemini: async () => ({
      text: 'not JSON',
      model: 'gemini-test',
      usage: { inputTokens: 11, outputTokens: 4 },
    }),
    openai: async () => ({
      text: validText,
      model: 'openai-test',
      usage: { inputTokens: 12, outputTokens: 5 },
    }),
  }, validate);

  assert.equal(result.provider, 'openai');
  assert.equal(result.analysis.value, 'validated');
  assert.deepEqual(
    result.attempts.map(attempt => ({
      provider: attempt.provider,
      inputTokens: attempt.usage?.inputTokens,
      outputTokens: attempt.usage?.outputTokens,
    })),
    [
      { provider: 'gemini', inputTokens: 11, outputTokens: 4 },
      { provider: 'openai', inputTokens: 12, outputTokens: 5 },
    ],
  );
});

test('does not fail over for invalid requests, but does for provider service errors', () => {
  assert.equal(shouldFailOver(Object.assign(new Error('Bad request'), { status: 400 })), false);
  assert.equal(shouldFailOver(Object.assign(new Error('Rate limited'), { status: 429 })), true);
  assert.equal(shouldFailOver(Object.assign(new Error('Server error'), { status: 503 })), true);
});

test('does not loop if the fallback provider also returns invalid output', async () => {
  let openAICalls = 0;
  await assert.rejects(
    runWithGeminiOpenAIFallback({
      gemini: async () => ({ text: 'bad', model: 'gemini-test' }),
      openai: async () => {
        openAICalls += 1;
        return { text: 'also bad', model: 'openai-test' };
      },
    }, validate),
    error => error instanceof AIProvidersUnavailableError && error.attempts.length === 2,
  );
  assert.equal(openAICalls, 1);
});

test('records finish reason and sanitized failure categories for incomplete JSON attempts', async () => {
  const validateOutput = (text: string, output: { finishReason?: string | null }) =>
    parseProviderJsonOutput(text, output.finishReason, value => {
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as Record<string, unknown>).value === 'string'
      ) {
        return { success: true as const, data: value as { value: string } };
      }
      return { success: false as const };
    });

  await assert.rejects(
    runWithGeminiOpenAIFallback({
      gemini: async () => ({
        text: '{"value":',
        model: 'gemini-test',
        finishReason: 'MAX_TOKENS',
        usage: { inputTokens: 30, outputTokens: 32 },
      }),
      openai: async () => ({
        text: 'not-json',
        model: 'openai-test',
        finishReason: 'stop',
      }),
    }, validateOutput),
    (error) => {
      assert.ok(error instanceof AIProvidersUnavailableError);
      assert.deepEqual(
        error.attempts.map(attempt => ({
          provider: attempt.provider,
          finishReason: attempt.finishReason,
          outputStatus: attempt.outputStatus,
          validationFailure: attempt.validationFailure,
        })),
        [
          {
            provider: 'gemini',
            finishReason: 'MAX_TOKENS',
            outputStatus: 'invalid',
            validationFailure: 'incomplete_output',
          },
          {
            provider: 'openai',
            finishReason: 'stop',
            outputStatus: 'invalid',
            validationFailure: 'invalid_json',
          },
        ],
      );
      assert.doesNotMatch(JSON.stringify(error.attempts), /not-json|\{"value"/);
      return true;
    },
  );
});
