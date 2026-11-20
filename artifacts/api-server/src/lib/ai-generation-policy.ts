import type { RequestHandler } from 'express';

export const AI_GENERATION_ENABLED_ENV = 'ZIONCORE_2ND_AI_GENERATION_ENABLED';
export const AI_AUDIO_GENERATION_ENABLED_ENV = 'ZIONCORE_2ND_AI_AUDIO_GENERATION_ENABLED';
export const AI_GENERATION_DISABLED_MESSAGE =
  'Cloud AI interpretation is temporarily unavailable. Local analysis remains available.';

/**
 * Cloud generation is opt-in. Keep it off until the owner enables it after
 * report-quality, provider-cost, and deployment checks have passed.
 */
export function isAiGenerationEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment[AI_GENERATION_ENABLED_ENV]?.trim().toLowerCase() === 'true';
}

export function requireAiGenerationEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  return (_req, res, next) => {
    if (!isAiGenerationEnabled(environment)) {
      res.set('Cache-Control', 'no-store');
      res.status(503).json({ error: AI_GENERATION_DISABLED_MESSAGE });
      return;
    }
    next();
  };
}

export function isAiAudioGenerationEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return isAiGenerationEnabled(environment) &&
    environment[AI_AUDIO_GENERATION_ENABLED_ENV]?.trim().toLowerCase() === 'true';
}

export function requireAiAudioGenerationEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): RequestHandler {
  return (_req, res, next) => {
    if (!isAiAudioGenerationEnabled(environment)) {
      res.set('Cache-Control', 'no-store');
      res.status(503).json({ error: AI_GENERATION_DISABLED_MESSAGE });
      return;
    }
    next();
  };
}
