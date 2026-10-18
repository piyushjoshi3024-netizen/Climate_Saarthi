import { ApiError } from '../utils/response.js';

/** Fail fast with 503 when the database is not connected, instead of hanging or 500-ing. */
export const requireDatabase = (store) => (_req, _res, next) => {
  if (store.isReady()) return next();
  return next(
    new ApiError(
      503,
      'DATABASE_UNAVAILABLE',
      'Sign-in is temporarily unavailable because the database is not connected. Please try again shortly.'
    )
  );
};
