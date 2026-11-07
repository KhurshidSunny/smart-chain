const SECRET_KEY = /password|passwd|secret|token|authorization|cookie|csrf|api[_-]?key|credential/i;
const PII_KEY = /email|phone|mobile|shippingaddress|^address$|street|zipcode/i;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

function redactString(value) {
  return String(value).replace(BEARER, 'Bearer [redacted]').replace(JWT, '[redacted]');
}

function redact(value, key) {
  if (key && (SECRET_KEY.test(key) || PII_KEY.test(key))) {
    return '[redacted]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [childKey, child] of Object.entries(value)) {
      out[childKey] = redact(child, childKey);
    }
    return out;
  }
  if (typeof value === 'string') {
    return redactString(value);
  }
  return value;
}

module.exports = { redact, redactString };
