// Token helpers. Access tokens are short-lived JWTs; refresh tokens are opaque random
// strings stored only as SHA-256 hashes and rotated on every use.
import jwt from 'jsonwebtoken';
import { randomBytes, createHmac } from 'node:crypto';

const ISSUER = 'climate-saarthi';
const AUDIENCE = 'climate-saarthi-web';

export function signAccessToken(user, { secret, ttlMs }) {
  return jwt.sign({ role: user.role, tv: user.tokenVersion ?? 0 }, secret, {
    subject: String(user.id),
    expiresIn: Math.floor(ttlMs / 1000),
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: 'HS256',
  });
}

/** Returns { ok:true, payload } or { ok:false, code } where code is TOKEN_EXPIRED or TOKEN_INVALID. */
export function verifyAccessToken(token, { secret }) {
  try {
    const payload = jwt.verify(token, secret, { issuer: ISSUER, audience: AUDIENCE, algorithms: ['HS256'] });
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, code: err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID' };
  }
}

export const newRefreshToken = () => randomBytes(48).toString('base64url');
export const newFamilyId = () => randomBytes(16).toString('hex');

// HMAC with the refresh secret so a leaked sessions collection can't be matched offline.
export const hashRefreshToken = (token, secret) => createHmac('sha256', secret).update(String(token)).digest('hex');
