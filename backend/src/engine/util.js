// Small pure helpers shared by the engine. No I/O, no randomness, no wall-clock reads.

const HOUR_MS = 3_600_000;

/** Parse a Date | ISO string | epoch ms into epoch ms, or null if invalid/missing. */
export function toMs(value) {
  if (value === null || value === undefined || value === '') return null;
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/** Require an explicit `now` so every calculation is reproducible. */
export function requireNow(now) {
  const ms = toMs(now);
  if (ms === null) {
    const err = new Error('Engine functions require an explicit, valid `now` timestamp');
    err.code = 'ENGINE_NOW_REQUIRED';
    throw err;
  }
  return ms;
}

export const hoursBetween = (fromMs, toMsValue) => (toMsValue - fromMs) / HOUR_MS;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);

/** Round half away from zero to `dp` decimals, avoiding binary float artefacts. */
export function round(v, dp = 1) {
  if (v === null || v === undefined || !Number.isFinite(v)) return v ?? null;
  const f = 10 ** dp;
  return Math.sign(v) * Math.round((Math.abs(v) + Number.EPSILON) * f) / f;
}

export const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
export const isUnit = (v) => isFiniteNumber(v) && v >= 0 && v <= 1;

export const idOf = (doc) => (doc ? String(doc._id ?? doc.id ?? '') || null : null);

/** Recursively freeze an object graph (used for config and in tests to prove purity). */
export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) deepFreeze(obj[key]);
  }
  return obj;
}

/** Great-circle distance in metres between two GeoJSON Points ([lng, lat]). */
export function haversineMeters(a, b) {
  const ca = a?.coordinates;
  const cb = b?.coordinates;
  if (!Array.isArray(ca) || !Array.isArray(cb) || ca.length < 2 || cb.length < 2) return null;
  const [lng1, lat1] = ca.map(Number);
  const [lng2, lat2] = cb.map(Number);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return null;
  const R = 6_371_000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const SEVERITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

/** Deterministic comparator helper: compares strings, treats null as last. */
export function cmpStr(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  return String(a) < String(b) ? -1 : 1;
}

export function formatNumber(v, dp = 0) {
  if (!isFiniteNumber(v)) return '—';
  return round(v, dp).toLocaleString('en-IN', { maximumFractionDigits: dp });
}
