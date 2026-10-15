import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key), removeItem: (key) => storage.delete(key), setItem: (key, value) => storage.set(key, value) };
globalThis.window = { location: { pathname: '/login' } };
const { ApiClient } = await import('../src/lib/api.js');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => storage.clear());

test('access tokens stay in memory and legacy persistent tokens are removed', () => {
  storage.set('accessToken', 'legacy');
  const client = new ApiClient();
  assert.equal(storage.has('accessToken'), false);
  client.setToken('new');
  assert.equal(client.getToken(), 'new');
  assert.equal(storage.has('accessToken'), false);
});

test('parallel clients share one refresh operation on the shared instance', async () => {
  const client = new ApiClient();
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 10)); return json({ data: { accessToken: 'fresh' } }); };
  assert.deepEqual(await Promise.all([client.refreshToken(), client.refreshToken(), client.refreshToken()]), [true, true, true]);
  assert.equal(calls, 1);
});

test('logout during a pending refresh cannot restore a token', async () => {
  const client = new ApiClient();
  let resolve;
  globalThis.fetch = () => new Promise((done) => { resolve = done; });
  const refresh = client.refreshToken();
  client.setToken(null);
  resolve(json({ data: { accessToken: 'stale' } }));
  assert.equal(await refresh, false);
  assert.equal(client.getToken(), null);
});

test('failed login never triggers refresh retries', async () => {
  const client = new ApiClient();
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return json({ message: 'Invalid credentials' }, 401); };
  await assert.rejects(client.post('/auth/employee/login', {}), /Invalid credentials/);
  assert.equal(calls, 1);
});

test('an authenticated request retries once after refresh and sends the new bearer token', async () => {
  const client = new ApiClient();
  client.setToken('old');
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.endsWith('/auth/refresh')) return json({ data: { accessToken: 'new' } });
    return requests.length === 1 ? json({}, 401) : json({ data: { ok: true } });
  };
  assert.equal((await client.get('/leads')).data.ok, true);
  assert.equal(requests.length, 3);
  assert.equal(requests[2].options.headers.Authorization, 'Bearer new');
});
