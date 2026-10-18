import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const handler = (_req, res, _next, options) =>
  res.status(options.statusCode).json({
    success: false,
    message: 'Too many attempts. Please wait a few minutes and try again.',
    error: { code: 'RATE_LIMITED' },
  });

/** Brute-force protection for sign-in: per IP + email. */
export const loginLimiter = (opts = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opts.limit ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}:${String(req.body?.email ?? '').toLowerCase()}`,
    handler,
  });

/** Account creation and refresh: per IP. */
export const authWriteLimiter = (opts = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opts.limit ?? 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler,
  });
