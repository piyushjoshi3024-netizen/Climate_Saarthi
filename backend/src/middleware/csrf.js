import { ApiError } from '../utils/response.js';

export const CSRF_HEADER = 'x-cs-csrf';
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence for cookie-based sessions: every state-changing request must carry a custom
 * header. Browsers cannot add custom headers to cross-site form posts, and cross-origin
 * fetches with a custom header need a CORS preflight that only allowed origins pass.
 * Works together with SameSite cookies and the exact-origin CORS allow-list.
 */
export function requireCsrfHeader(req, _res, next) {
  if (!UNSAFE.has(req.method)) return next();
  if (req.get(CSRF_HEADER) === '1') return next();
  return next(new ApiError(403, 'CSRF_HEADER_MISSING', `State-changing requests must include the ${CSRF_HEADER}: 1 header`));
}
