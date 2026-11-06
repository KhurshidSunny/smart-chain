const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAuthRateLimit } = require('./rateLimiter');

function listen(app) {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function send(server) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: '/login', method: 'POST' }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });
}

test('auth rate limit rejects the request past the cap', async () => {
  const app = express();
  app.post('/login', createAuthRateLimit({ windowMs: 60 * 1000, max: 2 }), (req, res) => {
    res.json({ ok: true });
  });

  const server = await listen(app);
  try {
    assert.equal(await send(server), 200);
    assert.equal(await send(server), 200);
    assert.equal(await send(server), 429);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
