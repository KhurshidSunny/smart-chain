const test = require('node:test');
const assert = require('node:assert/strict');
const { redact } = require('./redact');

test('redacts credentials, tokens, and contact fields', () => {
  const safe = redact({
    correlationId: 'order-1',
    password: 'secret-pass',
    refreshToken: 'refresh-value',
    authorization: 'Bearer abc.def.ghi',
    cookie: 'smartchain_refresh=1',
    email: 'person@example.com',
    shippingAddress: { street: '1 Road', city: 'Jalalabad' },
    nested: { apiKey: 'k', phone: '123' },
  });

  assert.equal(safe.correlationId, 'order-1');
  assert.equal(safe.password, '[redacted]');
  assert.equal(safe.refreshToken, '[redacted]');
  assert.equal(safe.authorization, '[redacted]');
  assert.equal(safe.cookie, '[redacted]');
  assert.equal(safe.email, '[redacted]');
  assert.equal(safe.shippingAddress, '[redacted]');
  assert.equal(safe.nested.apiKey, '[redacted]');
  assert.equal(safe.nested.phone, '[redacted]');
});

test('redacts a bearer token or JWT left inside a message', () => {
  const safe = redact({
    message: 'rejected Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature now',
  });
  assert.equal(safe.message.includes('eyJ'), false);
  assert.match(safe.message, /\[redacted\]/);
});
