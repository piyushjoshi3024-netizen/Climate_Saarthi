// Coverage engine:
//   effectiveCapacity = availableCapacity × reliability × accessibility × availabilityFactor
//   coverage (%)      = min(1, effectiveCapacity / requiredCapacity) × 100
//   deficit (%)       = 100 − coverage
// availabilityFactor = availability × operational status × freshness (stale/unverified).
import { resolveConfig, serviceForType, SERVICES } from './scoring.config.js';
import { toMs, requireNow, clamp01, round, idOf, isFiniteNumber, isUnit } from './util.js';

const DAY_MS = 86_400_000;

/** Analyse one resource. Returns { ok:true, resource } or { ok:false, review }. */
export function analyseResource(raw, { nowMs, config }) {
  const id = idOf(raw);
  const type = String(raw?.type ?? '').toUpperCase();
  const service = serviceForType(type, config);
  const problems = [];

  if (!service) problems.push(`resource type "${raw?.type}" is not mapped to a service`);
  const expectedUnit = service ? config.coverage.services[service].unit : null;
  if (service && raw?.unit !== expectedUnit) problems.push(`unit "${raw?.unit}" does not match expected "${expectedUnit}"`);
  if (!isFiniteNumber(raw?.capacity) || raw.capacity < 0) problems.push('capacity must be a non-negative number');
  if (!isUnit(raw?.reliability)) problems.push('reliability must be between 0 and 1');
  if (!isUnit(raw?.accessibility)) problems.push('accessibility must be between 0 and 1');

  const availabilityKey = String(raw?.availability ?? 'AVAILABLE').toUpperCase();
  const statusKey = String(raw?.status ?? 'OPERATIONAL').toUpperCase();
  if (!(availabilityKey in config.coverage.availability)) problems.push(`unknown availability "${raw?.availability}"`);
  if (!(statusKey in config.coverage.status)) problems.push(`unknown status "${raw?.status}"`);

  if (problems.length) return { ok: false, review: { kind: 'resource', id, reason: problems.join('; ') } };

  const verificationStatus = String(raw?.verificationStatus ?? 'PENDING').toUpperCase();
  const lastVerifiedMs = toMs(raw?.lastVerifiedAt ?? raw?.verifiedAt);
  const ageDays = lastVerifiedMs === null ? null : (nowMs - lastVerifiedMs) / DAY_MS;
  const stale =
    verificationStatus === 'STALE' || (ageDays !== null && ageDays > config.coverage.staleAfterDays);
  const verified = verificationStatus === 'VERIFIED' && !stale;

  const availability = config.coverage.availability[availabilityKey];
  const status = config.coverage.status[statusKey];
  const freshness = stale ? config.coverage.staleFactor : verified ? 1 : config.coverage.unverifiedFactor;
  const availabilityFactor = availability * status * freshness;
  const effectiveCapacity = raw.capacity * raw.reliability * raw.accessibility * availabilityFactor;

  return {
    ok: true,
    resource: {
      id,
      name: raw.name ?? null,
      type,
      service,
      unit: raw.unit,
      capacity: raw.capacity,
      reliability: raw.reliability,
      accessibility: raw.accessibility,
      availability: availabilityKey,
      status: statusKey,
      verificationStatus,
      lastVerifiedAt: lastVerifiedMs === null ? null : new Date(lastVerifiedMs).toISOString(),
      daysSinceVerified: ageDays === null ? null : round(ageDays, 1),
      stale,
      verified,
      factors: { availability, status, freshness, availabilityFactor },
      effectiveCapacity,
      usable: effectiveCapacity > 0,
      location: raw.location ?? null,
      is_demo: Boolean(raw.is_demo),
      is_hypothetical: Boolean(raw.is_hypothetical),
    },
  };
}

function basisValue(locality, basis) {
  const v = locality?.[basis];
  return isFiniteNumber(v) && v >= 0 ? v : null;
}

/**
 * computeCoverage({ locality, resources }, { now, config })
 */
export function computeCoverage({ locality, resources = [] } = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const review = [];
  const analysed = [];

  for (const raw of resources) {
    const res = analyseResource(raw, { nowMs, config });
    if (res.ok) analysed.push(res.resource);
    else review.push(res.review);
  }

  const byService = {};
  for (const s of SERVICES) {
    const svc = config.coverage.services[s];
    const list = analysed.filter((r) => r.service === s).sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
    const basis = basisValue(locality, svc.basis);
    const required = basis === null ? null : basis * svc.ratePerPerson;
    const effective = list.reduce((sum, r) => sum + r.effectiveCapacity, 0);
    const listedCapacity = list.reduce((sum, r) => sum + r.capacity, 0);

    let coveragePct = null;
    if (required === null) {
      review.push({ kind: 'locality', id: idOf(locality), reason: `cannot compute ${s} demand: ${svc.basis} is missing or invalid` });
    } else if (required === 0) {
      coveragePct = 100;
    } else {
      coveragePct = Math.min(1, effective / required) * 100;
    }

    byService[s] = {
      service: s,
      label: svc.label,
      unit: svc.unit,
      basis: svc.basis,
      basisValue: basis,
      ratePerPerson: svc.ratePerPerson,
      required: required === null ? null : round(required, 2),
      effective: round(effective, 2),
      listedCapacity: round(listedCapacity, 2),
      shortfall: required === null ? null : round(Math.max(0, required - effective), 2),
      listed: list.length,
      usable: list.filter((r) => r.usable).length,
      // Displayed coverage and deficit always add up to 100.
      coveragePct: coveragePct === null ? null : round(coveragePct, 1),
      deficitPct: coveragePct === null ? null : round(100 - round(coveragePct, 1), 1),
      weight: svc.weight,
      resources: list,
      _coverageExact: coveragePct, // internal precision for overall/priority; stripped in snapshots
    };
  }

  // Overall coverage: service-weighted mean over services with known demand.
  const known = SERVICES.filter((s) => byService[s]._coverageExact !== null);
  let overallCoverage = null;
  let weightsUsed = null;
  if (known.length === SERVICES.length) {
    overallCoverage = SERVICES.reduce((sum, s) => sum + byService[s].weight * byService[s]._coverageExact, 0);
    weightsUsed = Object.fromEntries(SERVICES.map((s) => [s, byService[s].weight]));
  }
  // Partial demand data is not guessed: overall stays null and the locality needs review.

  return {
    byService,
    overall: {
      coveragePct: overallCoverage === null ? null : round(overallCoverage, 1),
      deficitPct: overallCoverage === null ? null : round(100 - round(overallCoverage, 1), 1),
      _deficitExact: overallCoverage === null ? null : clamp01((100 - overallCoverage) / 100),
      weights: weightsUsed,
      status: overallCoverage === null ? 'NEEDS_REVIEW' : 'OK',
    },
    resources: analysed,
    review,
  };
}
