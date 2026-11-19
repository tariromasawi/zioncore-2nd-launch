import assert from 'node:assert/strict';
import test from 'node:test';
import {
  audioSegmentInsightSchema,
  buildAnalysisPrompt,
  explanationSchema,
  toGeminiResponseJsonSchema,
} from '@workspace/frequency-ai-contract';

const supportedFields = new Set([
  'type',
  'properties',
  'required',
  'enum',
  'items',
  'maximum',
  'maxItems',
  'minimum',
  'minItems',
  'nullable',
  'description',
  'format',
  'anyOf',
  'propertyOrdering',
]);

function assertOnlySupportedFields(schema: unknown): void {
  if (Array.isArray(schema)) {
    schema.forEach(assertOnlySupportedFields);
    return;
  }
  if (!schema || typeof schema !== 'object') return;

  const record = schema as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    assert.ok(supportedFields.has(key), `unsupported Gemini schema field: ${key}`);
    if (key === 'properties' && value && typeof value === 'object') {
      Object.values(value).forEach(assertOnlySupportedFields);
    } else {
      assertOnlySupportedFields(value);
    }
  }
}

test('Gemini analysis schema preserves required fields and removes unsupported keywords', () => {
  const schema = toGeminiResponseJsonSchema(explanationSchema);
  const properties = schema.properties as Record<string, unknown>;

  assert.equal(schema.type, 'object');
  assert.equal(Object.keys(properties).length, 17);
  assert.deepEqual(schema.required, Object.keys(properties));
  assert.deepEqual(schema.propertyOrdering, Object.keys(properties));
  assert.deepEqual(properties.faithReflection, { type: 'string', nullable: true });
  assertOnlySupportedFields(schema);
  assert.equal(explanationSchema.safeParse({}).success, false);
});

test('Gemini audio segment schema matches the bounded audio observation contract', () => {
  const schema = toGeminiResponseJsonSchema(audioSegmentInsightSchema);
  assert.deepEqual(schema.required, ['observations', 'speechOrEventDetail']);
  assert.deepEqual(schema.propertyOrdering, ['observations', 'speechOrEventDetail']);
  assert.deepEqual(
    (schema.properties as Record<string, unknown>).speechOrEventDetail,
    { type: 'string', nullable: true },
  );
  assertOnlySupportedFields(schema);
});

test('Gemini prompts defer response shape to the schema while OpenAI retains explicit JSON guidance', () => {
  const measurement = {
    captureSource: 'audio-file' as const,
    sampleRate: 48_000,
    fftSize: 4096 as const,
    frequencyResolutionHz: 48_000 / 4096,
    dominantFrequencyHz: null,
    topPeaksHz: [],
    rmsLevel: 0,
    durationSeconds: 1,
  };
  const geminiPrompt = buildAnalysisPrompt(measurement, false, '', false);
  const openAiPrompt = buildAnalysisPrompt(measurement, false, '', true);

  assert.match(geminiPrompt, /structured response schema supplied with this request/);
  assert.doesNotMatch(geminiPrompt, /Required keys:/);
  assert.match(openAiPrompt, /Required keys:/);
});
