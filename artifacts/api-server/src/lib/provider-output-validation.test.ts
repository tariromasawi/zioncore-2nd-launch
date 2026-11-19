import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseProviderJsonOutput,
  ProviderOutputValidationError,
} from './provider-output-validation';
import { appendProviderText } from './provider-execution';

const validateObject = (value: unknown) => {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).result === 'string'
  ) {
    return { success: true as const, data: value as { result: string } };
  }
  return { success: false as const };
};

test('assembles parsed JSON after streamed content has been joined', () => {
  const chunks = ['{"result":', '"complete"}'];
  const output = chunks.reduce((current, chunk) => appendProviderText(current, chunk), '');
  assert.deepEqual(parseProviderJsonOutput(output, 'STOP', validateObject), {
    result: 'complete',
  });
});

test('classifies empty provider output without exposing content', () => {
  assert.throws(
    () => parseProviderJsonOutput(' \n ', 'STOP', validateObject),
    (error) => error instanceof ProviderOutputValidationError &&
      error.category === 'empty_output',
  );
});

test('distinguishes token-limited incomplete JSON from malformed JSON', () => {
  assert.throws(
    () => parseProviderJsonOutput('{"result":', 'MAX_TOKENS', validateObject),
    (error) => error instanceof ProviderOutputValidationError &&
      error.category === 'incomplete_output',
  );
  assert.throws(
    () => parseProviderJsonOutput('not-json', 'STOP', validateObject),
    (error) => error instanceof ProviderOutputValidationError &&
      error.category === 'invalid_json',
  );
});

test('distinguishes a valid JSON object with the wrong shape from a token-limited result', () => {
  assert.throws(
    () => parseProviderJsonOutput('{"wrong":"shape"}', 'STOP', validateObject),
    (error) => error instanceof ProviderOutputValidationError &&
      error.category === 'schema_invalid',
  );
  assert.throws(
    () => parseProviderJsonOutput('{"wrong":"shape"}', 'LENGTH', validateObject),
    (error) => error instanceof ProviderOutputValidationError &&
      error.category === 'incomplete_output',
  );
});

test('normalizes fenced JSON before schema validation', () => {
  assert.deepEqual(
    parseProviderJsonOutput('```json\n{"result":"ok"}\n```', 'STOP', validateObject),
    { result: 'ok' },
  );
});
