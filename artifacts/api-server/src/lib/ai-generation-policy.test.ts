import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import {
  AI_GENERATION_DISABLED_MESSAGE,
  isAiAudioGenerationEnabled,
  isAiGenerationEnabled,
  requireAiGenerationEnabled,
} from './ai-generation-policy';

test('cloud AI generation is opt-in and requires the exact true setting', () => {
  assert.equal(isAiGenerationEnabled({} as NodeJS.ProcessEnv), false);
  assert.equal(isAiGenerationEnabled({ ZIONCORE_2ND_AI_GENERATION_ENABLED: 'false' } as NodeJS.ProcessEnv), false);
  assert.equal(isAiGenerationEnabled({ ZIONCORE_2ND_AI_GENERATION_ENABLED: '1' } as NodeJS.ProcessEnv), false);
  assert.equal(isAiGenerationEnabled({ ZIONCORE_2ND_AI_GENERATION_ENABLED: 'true' } as NodeJS.ProcessEnv), true);
  assert.equal(isAiAudioGenerationEnabled({
    ZIONCORE_2ND_AI_GENERATION_ENABLED: 'true',
    ZIONCORE_2ND_AI_AUDIO_GENERATION_ENABLED: 'false',
  } as NodeJS.ProcessEnv), false);
  assert.equal(isAiAudioGenerationEnabled({
    ZIONCORE_2ND_AI_GENERATION_ENABLED: 'true',
    ZIONCORE_2ND_AI_AUDIO_GENERATION_ENABLED: 'true',
  } as NodeJS.ProcessEnv), true);
});

test('the generation gate rejects before continuing when the provider feature is off', async () => {
  let continued = false;
  const app = express();
  app.post('/generate', requireAiGenerationEnabled({} as NodeJS.ProcessEnv), (_req, res) => {
    continued = true;
    res.sendStatus(200);
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const response = await fetch(`http://127.0.0.1:${address.port}/generate`, { method: 'POST' });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: AI_GENERATION_DISABLED_MESSAGE });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(continued, false);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
