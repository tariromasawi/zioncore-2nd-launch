import assert from 'node:assert/strict';
import test from 'node:test';
import { getTrustedBillingOrigin } from './billing-origin';

test('production billing returns use only the configured standalone ZionCore 2nd origin', () => {
  const environment = {
    nodeEnv: 'production',
    productionOrigin: 'https://zioncore-2nd.example',
  };
  assert.equal(
    getTrustedBillingOrigin('https://zioncore-2nd.example', environment),
    'https://zioncore-2nd.example',
  );
});

test('production billing rejects the main site, preview, lookalike, and insecure origins', () => {
  const environment = {
    nodeEnv: 'production',
    productionOrigin: 'https://zioncore-2nd.example',
    replitDomains: 'zioncore.replit.app,preview.replit.dev',
  };
  assert.equal(getTrustedBillingOrigin('https://zioncore.replit.app', environment), null);
  assert.equal(getTrustedBillingOrigin('https://preview.replit.dev', environment), null);
  assert.equal(getTrustedBillingOrigin('https://zioncore.replit.app.attacker.example', environment), null);
  assert.equal(getTrustedBillingOrigin('http://zioncore.replit.app', environment), null);
});

test('production billing fails closed when the standalone origin is unset or malformed', () => {
  assert.equal(
    getTrustedBillingOrigin('https://zioncore-2nd.example', { nodeEnv: 'production' }),
    null,
  );
  assert.equal(
    getTrustedBillingOrigin('https://zioncore-2nd.example', {
      nodeEnv: 'production',
      productionOrigin: 'https://zioncore.replit.app',
    }),
    null,
  );
});

test('development accepts only local origins or explicitly injected Replit hosts', () => {
  const environment = {
    nodeEnv: 'development',
    replitDomains: 'preview.replit.dev',
    replitDevDomain: 'local-preview.replit.dev',
  };
  assert.equal(getTrustedBillingOrigin('http://localhost:5173', environment), 'http://localhost:5173');
  assert.equal(getTrustedBillingOrigin('https://preview.replit.dev', environment), 'https://preview.replit.dev');
  assert.equal(getTrustedBillingOrigin('https://unlisted.example', environment), null);
});
