import { ApiError } from '../utils/response.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';
import { ACCESS_COOKIE } from '../modules/auth/cookies.js';

function readToken(req) {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (fromCookie) return fromCookie;
  // Bearer tokens are accepted for API clients such as Thunder Client.
  const h = req.get('authorization');
  if (h && /^Bearer\s+/i.test(h)) return h.replace(/^Bearer\s+/i, '').trim();
  return null;
}

/**
 * Resolve the signed-in user from the access token. The user record is re-read on every
 * request so disabled accounts and role changes (tokenVersion bump) take effect at once.
 * `optional: true` attaches req.user when present but never rejects.
 */
export function authenticate({ store, auth, optional = false }) {
  return async (req, _res, next) => {
    try {
      const token = readToken(req);
      if (!token) return optional ? next() : next(new ApiError(401, 'AUTH_REQUIRED', 'Please sign in'));
      const result = verifyAccessToken(token, { secret: auth.accessSecret });
      if (!result.ok) {
        if (optional) return next();
        return next(
          new ApiError(401, result.code, result.code === 'TOKEN_EXPIRED' ? 'Your session needs refreshing' : 'Please sign in')
        );
      }
      const user = await store.users.findById(result.payload.sub);
      if (!user || user.status !== 'ACTIVE' || (user.tokenVersion ?? 0) !== (result.payload.tv ?? 0)) {
        return optional ? next() : next(new ApiError(401, 'TOKEN_INVALID', 'Please sign in'));
      }
      req.user = user;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/** Role gate. Must run after authenticate. */
export function authorize(...roles) {
  const allowed = roles.flat();
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'AUTH_REQUIRED', 'Please sign in'));
    if (allowed.length && !allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this'));
    }
    return next();
  };
}
