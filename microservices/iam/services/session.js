const crypto = require('crypto');

const REFRESH_COOKIE = 'smartchain_refresh';
const CSRF_COOKIE = 'smartchain_csrf';

class SessionError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'SessionError';
    this.status = status;
  }
}

function expiryToSeconds(value) {
  const match = /^(\d+)([smhd])$/.exec(value || '');
  if (!match) return 7 * 24 * 60 * 60;
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return Number(match[1]) * unit;
}

function cookieSecure() {
  return process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
}

function serializeCookie(name, value, { maxAge, httpOnly, path }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (cookieSecure()) parts.push('Secure');
  return parts.join('; ');
}

function refreshMaxAge() {
  return expiryToSeconds(process.env.REFRESH_TOKEN_EXPIRY || '7d');
}

function sessionCookies(refreshToken, csrfToken) {
  const maxAge = refreshMaxAge();
  return [
    serializeCookie(REFRESH_COOKIE, refreshToken, { maxAge, httpOnly: true, path: '/auth' }),
    serializeCookie(CSRF_COOKIE, csrfToken, { maxAge, httpOnly: false, path: '/' }),
  ];
}

function clearedSessionCookies() {
  return [
    serializeCookie(REFRESH_COOKIE, '', { maxAge: 0, httpOnly: true, path: '/auth' }),
    serializeCookie(CSRF_COOKIE, '', { maxAge: 0, httpOnly: false, path: '/' }),
  ];
}

function setSessionCookies(res, refreshToken, csrfToken) {
  for (const cookie of sessionCookies(refreshToken, csrfToken)) {
    res.append('Set-Cookie', cookie);
  }
}

function clearSessionCookies(res) {
  for (const cookie of clearedSessionCookies()) {
    res.append('Set-Cookie', cookie);
  }
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfMatches(cookieValue, headerValue) {
  const cookie = Buffer.from(String(cookieValue || ''));
  const header = Buffer.from(String(headerValue || ''));
  if (cookie.length === 0 || cookie.length !== header.length) return false;
  return crypto.timingSafeEqual(cookie, header);
}

function assertCsrf(csrfCookie, csrfHeader) {
  if (!csrfMatches(csrfCookie, csrfHeader)) {
    throw new SessionError(403, 'Cross-site request rejected');
  }
}

function requireCsrf(req, res, next) {
  try {
    assertCsrf(readCookie(req, CSRF_COOKIE), req.get('x-csrf-token'));
    return next();
  } catch (error) {
    return res.status(error.status || 403).json({ message: error.message });
  }
}

function authBody(session, user) {
  return {
    token: session.token,
    csrfToken: session.csrfToken,
    user,
  };
}

function establishSession(user, deps) {
  return {
    token: deps.generateToken(user),
    refreshToken: deps.generateRefreshToken(user),
    csrfToken: deps.createCsrfToken(),
    user,
  };
}

async function rotateRefresh(input, deps) {
  assertCsrf(input.csrfCookie, input.csrfHeader);
  if (!input.refreshToken) throw new SessionError(401, 'Refresh token required');
  if (await deps.isBlacklisted(input.refreshToken)) {
    throw new SessionError(401, 'Refresh token invalidated');
  }

  let decoded;
  try {
    decoded = deps.verifyRefreshToken(input.refreshToken);
  } catch {
    throw new SessionError(401, 'Invalid or expired refresh token');
  }

  const user = await deps.loadUser(decoded);
  if (!user || user.isActive === false) throw new SessionError(401, 'Invalid refresh token');

  await deps.blacklist(input.refreshToken);
  return establishSession(user, deps);
}

async function revokeRefresh(input, deps) {
  assertCsrf(input.csrfCookie, input.csrfHeader);
  if (input.refreshToken && !(await deps.isBlacklisted(input.refreshToken))) {
    await deps.blacklist(input.refreshToken);
  }
}

module.exports = {
  REFRESH_COOKIE,
  CSRF_COOKIE,
  SessionError,
  sessionCookies,
  clearedSessionCookies,
  setSessionCookies,
  clearSessionCookies,
  readCookie,
  createCsrfToken,
  requireCsrf,
  authBody,
  establishSession,
  rotateRefresh,
  revokeRefresh,
};
