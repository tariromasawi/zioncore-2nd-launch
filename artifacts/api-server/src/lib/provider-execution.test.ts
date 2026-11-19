import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendProviderText, MAX_PROVIDER_RESPONSE_CHARACTERS,
  PROVIDER_ATTEMPT_TIMEOUT_MS, ProviderResponseLimitError,
  ProviderTimeoutError, withProviderDeadline,
} from './provider-execution';
import type { ProviderAttemptEvent } from './provider-execution';
import { runWithGeminiOpenAIFallback, shouldFailOver } from './ai-provider-router';
import { AI_INTERPRETATION_LEASE_MS } from './ai-interpretation-jobs';

test('two provider attempts leave lease time for validation and settlement', () => {
  assert.ok(PROVIDER_ATTEMPT_TIMEOUT_MS * 2 + 30_000 < AI_INTERPRETATION_LEASE_MS);
});

test('completed attempts return their output and clear their deadline', async () => {
  let signal: AbortSignal | undefined;
  assert.equal(await withProviderDeadline(async current => {
    signal = current; return 'complete';
  }, 10), 'complete');
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(signal?.aborted, false);
});

test('provider telemetry records correlation, timing and token usage without content', async () => {
  const events: ProviderAttemptEvent[] = [];
  const output = {
    text: 'private prompt and response must not enter telemetry',
    usage: { inputTokens: 11, outputTokens: 4 },
  };
  assert.equal(await withProviderDeadline(async () => output, 50, {
    requestId: 'request-test-1',
    provider: 'gemini',
    model: 'test-model',
    operation: 'text-interpretation',
    usageOf: value => (value as typeof output).usage,
    onEvent: event => events.push(event),
  }), output);

  assert.deepEqual(events.map(event => event.event), ['started', 'succeeded']);
  assert.ok(events.every(event => event.requestId === 'request-test-1'));
  assert.ok(events.every(event => Boolean(event.attemptId && event.startedAt && event.timestamp)));
  assert.equal(events[1]?.usage?.inputTokens, 11);
  assert.equal(events[1]?.usage?.outputTokens, 4);
  assert.equal(events[1]?.durationMs !== undefined, true);
  assert.doesNotMatch(JSON.stringify(events), /private prompt|response must not enter telemetry/);
});

test('provider error telemetry excludes error messages while retaining safe diagnostics', async () => {
  const events: ProviderAttemptEvent[] = [];
  const failure = Object.assign(new Error('secret prompt content'), {
    status: 503,
    code: 'UPSTREAM_UNAVAILABLE',
  });
  await assert.rejects(withProviderDeadline(async () => {
    throw failure;
  }, 50, {
    requestId: 'request-test-2',
    provider: 'gemini',
    model: 'test-model',
    operation: 'text-interpretation',
    onEvent: event => events.push(event),
  }), error => error === failure);

  const failed = events.find(event => event.event === 'failed');
  assert.equal(failed?.errorStatus, 503);
  assert.equal(failed?.errorCode, 'UPSTREAM_UNAVAILABLE');
  assert.equal(failed?.errorName, 'Error');
  assert.doesNotMatch(JSON.stringify(events), /secret prompt content/);
});

test('stalled provider setup times out and aborts its transport', async () => {
  let signal: AbortSignal | undefined;
  const events: ProviderAttemptEvent[] = [];
  await assert.rejects(withProviderDeadline(current => {
    signal = current; return new Promise(() => {});
  }, 10, {
    requestId: 'request-test-timeout',
    onEvent: event => events.push(event),
  }), ProviderTimeoutError);
  assert.equal(signal?.aborted, true);
  assert.equal(shouldFailOver(signal?.reason), true);
  assert.equal(events.find(event => event.event === 'failed')?.timedOut, true);
});

test('a stalled stream also reaches the attempt deadline', async () => {
  await assert.rejects(withProviderDeadline(async signal => {
    async function* chunks() {
      yield 'first chunk';
      await new Promise<void>((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    }
    for await (const _chunk of chunks()) { /* exercise stalled stream consumption */ }
  }, 10), ProviderTimeoutError);
});

test('original provider failures remain unchanged while their transport is aborted', async () => {
  const failure = Object.assign(new Error('Invalid request'), { status: 400 });
  let signal: AbortSignal | undefined;
  await assert.rejects(withProviderDeadline(async current => {
    signal = current; throw failure;
  }), cause => cause === failure);
  assert.equal(signal?.aborted, true);
  assert.equal(shouldFailOver(failure), false);
});

test('a timed-out primary makes one bounded fallback attempt', async () => {
  let fallbackCalls = 0;
  const result = await runWithGeminiOpenAIFallback({
    gemini: () => withProviderDeadline(() => new Promise(() => {}), 10),
    openai: async () => {
      fallbackCalls += 1;
      return { text: '{"reading":"complete"}', model: 'test-only' };
    },
  }, text => JSON.parse(text));
  assert.equal(result.fallbackUsed, true);
  assert.equal(fallbackCalls, 1);
});

test('oversized streams fail explicitly without returning a truncated reading', () => {
  const text = 'x'.repeat(MAX_PROVIDER_RESPONSE_CHARACTERS);
  assert.equal(appendProviderText('', text), text);
  assert.throws(() => appendProviderText(text, 'x'), ProviderResponseLimitError);
  assert.equal(shouldFailOver(new ProviderResponseLimitError()), true);
});
