export type ProviderOutputFailureCategory =
  | 'empty_output'
  | 'incomplete_output'
  | 'invalid_json'
  | 'schema_invalid'
  | 'quality_invalid';

export class ProviderOutputValidationError extends Error {
  constructor(readonly category: ProviderOutputFailureCategory) {
    super('The AI provider output did not pass validation.');
    this.name = 'ProviderOutputValidationError';
  }
}

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false };

function outputWasTruncated(finishReason: unknown): boolean {
  return typeof finishReason === 'string' &&
    ['MAX_TOKENS', 'LENGTH'].includes(finishReason.trim().toUpperCase());
}

export function parseProviderJsonOutput<T>(
  text: string,
  finishReason: unknown,
  safeParse: (value: unknown) => SafeParseResult<T>,
  normalize: (value: unknown) => unknown = value => value,
): T {
  const trimmed = text.trim();
  if (!trimmed) throw new ProviderOutputValidationError('empty_output');

  const jsonText = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  let decoded: unknown;
  try {
    decoded = JSON.parse(jsonText);
  } catch {
    throw new ProviderOutputValidationError(
      outputWasTruncated(finishReason) ? 'incomplete_output' : 'invalid_json',
    );
  }

  let normalized: unknown;
  try {
    normalized = normalize(decoded);
  } catch {
    throw new ProviderOutputValidationError('schema_invalid');
  }

  const validated = safeParse(normalized);
  if (!validated.success) {
    throw new ProviderOutputValidationError(
      outputWasTruncated(finishReason) ? 'incomplete_output' : 'schema_invalid',
    );
  }
  return validated.data;
}
