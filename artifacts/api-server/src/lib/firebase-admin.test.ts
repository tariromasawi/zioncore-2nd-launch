import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FirebaseAdminConfigurationError,
  resolveFirebaseAdminCredentialMode,
} from './firebase-admin';

test('uses JSON service credentials in the existing Replit runtime', () => {
  assert.equal(
    resolveFirebaseAdminCredentialMode({
      ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON: '{"project_id":"zioncore-2nd-production"}',
    } as NodeJS.ProcessEnv),
    'service-account-json',
  );
});

test('uses Application Default Credentials only in the named ZionCore 2nd Cloud Run service', () => {
  assert.equal(
    resolveFirebaseAdminCredentialMode({
      ZIONCORE_2ND_ADMIN_AUTH_MODE: 'adc',
      K_SERVICE: 'zioncore-2nd-api',
    } as NodeJS.ProcessEnv),
    'cloud-run-adc',
  );
  assert.throws(
    () => resolveFirebaseAdminCredentialMode({
      ZIONCORE_2ND_ADMIN_AUTH_MODE: 'adc',
      K_SERVICE: 'another-service',
    } as NodeJS.ProcessEnv),
    FirebaseAdminConfigurationError,
  );
});

test('fails closed when neither a service credential nor Cloud Run ADC is configured', () => {
  assert.throws(
    () => resolveFirebaseAdminCredentialMode({} as NodeJS.ProcessEnv),
    /ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON is not configured/,
  );
  assert.throws(
    () => resolveFirebaseAdminCredentialMode({
      ZIONCORE_2ND_ADMIN_AUTH_MODE: 'unexpected',
    } as NodeJS.ProcessEnv),
    /must be adc or service-account-json/,
  );
});
