const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {
  REFRESH_COOKIE,
  CSRF_COOKIE,
  SessionError,
  sessionCookies,
  authBody,
  establishSession,
  rotateRefresh,
  revokeRefresh,
  requireCsrf,
} = require('../services/session');

const refreshToken = 'refresh-token-value';
const csrfToken = 'csrf-token-value';

function memoryDeps(users) {
  const revoked = new Set();
  let issued = 0;
  return {
    revoked,
    generateToken() {
      issued += 1;
      return `access-${issued}`;
    },
    generateRefreshToken() {
      issued += 1;
      return `refresh-${issued}`;
    },
    createCsrfToken() {
      issued += 1;
      return `csrf-${issued}`;
    },
    verifyRefreshToken(token) {
      if (!token.startsWith('refresh-')) {
        const error = new Error('bad token');
        throw error;
      }
      return { id: 'user-1' };
    },
    async loadUser() {
      return users.current;
    },
    async isBlacklisted(token) {
      return revoked.has(token);
    },
    async blacklist(token) {
      revoked.add(token);
    },
  };
}

test('the refresh cookie is HttpOnly and the auth body does not contain it', () => {
  const cookies = sessionCookies(refreshToken, csrfToken);
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`));
  const csrfCookie = cookies.find((cookie) => cookie.startsWith(`${CSRF_COOKIE}=`));

  assert.match(refreshCookie, /HttpOnly/);
  assert.match(refreshCookie, /SameSite=Lax/);
  assert.match(refreshCookie, /Path=\/auth/);
  assert.doesNotMatch(csrfCookie, /HttpOnly/);

  const body = authBody({ token: 'access', csrfToken, refreshToken }, { id: 'user-1' });
  assert.equal(body.refreshToken, undefined);
  assert.equal(JSON.stringify(body).includes(refreshToken), false);
});

test('login, refresh, logout, and reuse of an old refresh token', async () => {
  const deps = memoryDeps({ current: { _id: 'user-1', isActive: true, email: 'a@b.c' } });
  const login = establishSession(deps.loadUser ? { _id: 'user-1' } : null, deps);
  const first = establishSession({ _id: 'user-1', isActive: true }, deps);

  const rotated = await rotateRefresh({
    refreshToken: first.refreshToken,
    csrfCookie: first.csrfToken,
    csrfHeader: first.csrfToken,
  }, deps);

  assert.equal(deps.revoked.has(first.refreshToken), true);
  assert.notEqual(rotated.refreshToken, first.refreshToken);
  assert.equal(rotated.token.startsWith('access-'), true);

  await assert.rejects(
    () => rotateRefresh({
      refreshToken: first.refreshToken,
      csrfCookie: rotated.csrfToken,
      csrfHeader: rotated.csrfToken,
    }, deps),
    (error) => error instanceof SessionError && error.status === 401
  );

  await revokeRefresh({
    refreshToken: rotated.refreshToken,
    csrfCookie: rotated.csrfToken,
    csrfHeader: rotated.csrfToken,
  }, deps);

  await assert.rejects(
    () => rotateRefresh({
      refreshToken: rotated.refreshToken,
      csrfCookie: rotated.csrfToken,
      csrfHeader: rotated.csrfToken,
    }, deps),
    (error) => error instanceof SessionError && error.message === 'Refresh token invalidated'
  );

  assert.equal(login.token.startsWith('access-'), true);
});

test('a cross-site refresh without the CSRF header is rejected', async () => {
  const app = express();
  app.post('/auth/refresh', requireCsrf, (req, res) => res.json({ ok: true }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  function send(headers) {
    return new Promise((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/auth/refresh', method: 'POST', headers }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString()) }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  try {
    const blocked = await send({
      cookie: `${REFRESH_COOKIE}=${refreshToken}; ${CSRF_COOKIE}=${csrfToken}`,
      origin: 'https://evil.example',
    });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.message, 'Cross-site request rejected');

    const allowed = await send({
      cookie: `${CSRF_COOKIE}=${csrfToken}`,
      'x-csrf-token': csrfToken,
    });
    assert.equal(allowed.status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
