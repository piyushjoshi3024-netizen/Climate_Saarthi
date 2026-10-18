import pino from 'pino';
import { env } from './env.js';

// Structured logs. Sensitive fields are redacted defensively even before auth exists.
export const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : env.logLevel,
  base: { service: 'climate-saarthi-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.refreshToken',
      '*.contactPrivate',
    ],
    censor: '[redacted]',
  },
});
