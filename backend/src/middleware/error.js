import { env } from '../config/env.js';
import { ApiError } from '../utils/response.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// Centralised error handler. Never returns stack traces in production.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';

  if (err instanceof ApiError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (/^Mongo(oseServerSelection|Network|NotConnected)/.test(err?.name ?? '') || err?.name === 'MongoServerSelectionError') {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'The database is not reachable right now. Please try again shortly.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (status >= 500) {
    (req.log || console).error({ err }, 'Unhandled error');
  }

  const body = { success: false, message, error: { code } };
  if (err instanceof ApiError && err.details) body.error.details = err.details;
  if (!env.isProduction && status >= 500 && err?.stack) body.error.stack = err.stack;

  res.status(status).json(body);
}
