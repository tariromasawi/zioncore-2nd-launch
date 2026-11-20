import assert from 'node:assert/strict';
import test from 'node:test';
import app from './app';

test('HTTP requests receive a server-generated correlation ID', async t => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  }));

  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/healthz`, {
    headers: { 'x-request-id': 'untrusted-client-value' },
  });

  assert.equal(response.status, 200);
  const requestId = response.headers.get('x-request-id');
  assert.ok(requestId && /^[0-9a-f-]{36}$/i.test(requestId));
  assert.notEqual(requestId, 'untrusted-client-value');
});
