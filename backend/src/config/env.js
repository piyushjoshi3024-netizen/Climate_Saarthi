// Validated runtime configuration. Secrets stay server-side and are never logged.
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

dotenv.config({ quiet: true });

const csv = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** "15m" | "7d" | "3600s" | "2h" | "900000" (ms) → milliseconds */
export function parseDuration(value) {
  const m = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(String(value).trim());
  if (!m) return null;
  const n = Number(m[1]);
  const mult = { ms: 1, s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 }[m[2] || 'ms'];
  return n * mult;
}

const bool = (def) =>
  z
    .enum(['true', 'false', '1', '0', ''])
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v === 'true' || v === '1'));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  // Exact origins only (comma-separated). No wildcards.
  CLIENT_ORIGIN: z.string().default('http://localhost:5173,http://localhost:4173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  // Data store: "mongo" (default, required in production) or "memory" (local dev/tests only).
  DATA_STORE: z.enum(['mongo', 'memory']).default('mongo'),
  MONGODB_URI: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_SECURE: bool(false),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  // Optional first-admin bootstrap from the environment (never hardcoded).
  BOOTSTRAP_ADMIN_EMAIL: z.string().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().optional(),
});

function fail(message) {
  console.error(`Invalid environment configuration: ${message}`);
  process.exit(1);
}

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Print only variable names and messages, never values.
  fail('\n  ' + parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  '));
}

const raw = parsed.data;
// `npm run dev:memory` passes --memory (works on Windows, macOS and Linux shells alike).
if (process.argv.includes('--memory')) raw.DATA_STORE = 'memory';
const isProduction = raw.NODE_ENV === 'production';
const origins = csv(raw.CLIENT_ORIGIN);
if (origins.some((o) => o.includes('*'))) fail('CLIENT_ORIGIN must list exact origins; wildcards are not allowed.');

const accessTtlMs = parseDuration(raw.ACCESS_TOKEN_TTL);
const refreshTtlMs = parseDuration(raw.REFRESH_TOKEN_TTL);
if (!accessTtlMs || !refreshTtlMs) fail('ACCESS_TOKEN_TTL / REFRESH_TOKEN_TTL must look like 15m, 7d, 3600s');

const weakSecret = (s) => !s || s.length < 32 || /replace_with/i.test(s);
const warnings = [];
let accessSecret = raw.JWT_ACCESS_SECRET;
let refreshSecret = raw.JWT_REFRESH_SECRET;

if (isProduction) {
  if (raw.DATA_STORE !== 'mongo') fail('DATA_STORE=memory is not allowed in production.');
  if (!raw.MONGODB_URI) fail('MONGODB_URI is required in production.');
  if (weakSecret(accessSecret) || weakSecret(refreshSecret)) {
    fail('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to long random values (32+ chars) in production.');
  }
  if (accessSecret === refreshSecret) fail('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ.');
  if (!raw.COOKIE_SECURE) fail('COOKIE_SECURE must be true in production.');
} else {
  // Development convenience: missing or placeholder secrets get random per-process values.
  // Sessions then reset whenever the server restarts.
  if (weakSecret(accessSecret)) {
    accessSecret = randomBytes(48).toString('base64url');
    warnings.push('JWT_ACCESS_SECRET missing or weak: using a random per-process secret (dev only).');
  }
  if (weakSecret(refreshSecret) || refreshSecret === accessSecret) {
    refreshSecret = randomBytes(48).toString('base64url');
    warnings.push('JWT_REFRESH_SECRET missing or weak: using a random per-process secret (dev only).');
  }
}
if (raw.COOKIE_SAME_SITE === 'none' && !raw.COOKIE_SECURE) fail('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
if (raw.DATA_STORE === 'mongo' && !raw.MONGODB_URI) {
  warnings.push('MONGODB_URI is not set: sign-in will be unavailable until a database is configured.');
}

export const env = Object.freeze({
  nodeEnv: raw.NODE_ENV,
  isProduction,
  isTest: raw.NODE_ENV === 'test',
  port: raw.PORT,
  clientOrigins: origins,
  logLevel: raw.LOG_LEVEL,
  trustProxy: raw.TRUST_PROXY,
  dataStore: raw.DATA_STORE,
  mongodbUri: raw.MONGODB_URI || null,
  auth: Object.freeze({
    accessSecret,
    refreshSecret,
    accessTtlMs,
    refreshTtlMs,
    cookieSecure: raw.COOKIE_SECURE,
    cookieSameSite: raw.COOKIE_SAME_SITE,
    bcryptRounds: raw.NODE_ENV === 'test' ? 4 : raw.BCRYPT_ROUNDS,
  }),
  bootstrapAdmin:
    raw.BOOTSTRAP_ADMIN_EMAIL && raw.BOOTSTRAP_ADMIN_PASSWORD
      ? Object.freeze({
          email: raw.BOOTSTRAP_ADMIN_EMAIL,
          password: raw.BOOTSTRAP_ADMIN_PASSWORD,
          name: raw.BOOTSTRAP_ADMIN_NAME || 'Administrator',
        })
      : null,
  warnings: Object.freeze(warnings),
});
