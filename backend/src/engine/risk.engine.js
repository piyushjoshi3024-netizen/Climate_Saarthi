// Risk engine: hazard from the latest valid official heat signal, plus local
// vulnerability and exposure. Resources are NOT considered here, so two localities
// with the same signal and demographics have the same risk (but may differ in priority).
import { resolveConfig } from './scoring.config.js';
import { toMs, requireNow, hoursBetween, clamp01, round, idOf, isFiniteNumber, isUnit } from './util.js';

/** Normalise and validate one signal; returns { ok, signal } or { ok:false, review }. */
function readSignal(raw, config) {
  const id = idOf(raw);
  const n = config.normalisation;
  const problems = [];
  const severity = String(raw?.severity ?? '').toUpperCase();
  const warningLevel = String(raw?.warningLevel ?? '').toUpperCase();
  const issuedMs = toMs(raw?.sourceTimestamp ?? raw?.issuedAt);
  const validUntilMs = toMs(raw?.validUntil);

  if (!(severity in n.severity)) problems.push(`unknown severity "${raw?.severity}"`);
  if (!(warningLevel in n.warningLevel)) problems.push(`unknown warning level "${raw?.warningLevel}"`);
  if (issuedMs === null) problems.push('missing or invalid issue time');
  if (validUntilMs === null) problems.push('missing or invalid validity end');
  if (issuedMs !== null && validUntilMs !== null && validUntilMs < issuedMs) problems.push('valid-until is before issue time');

  let trend = null;
  if (raw?.trend !== undefined && raw?.trend !== null && raw?.trend !== '') {
    const t = String(raw.trend).toUpperCase();
    if (t in n.trend) trend = t;
    else problems.push(`unknown trend "${raw.trend}"`);
  }

  if (problems.length) {
    return { ok: false, review: { kind: 'climateSignal', id, reason: problems.join('; ') } };
  }

  const w = config.hazard.weights;
  return {
    ok: true,
    signal: {
      id,
      raw,
      severity,
      warningLevel,
      trend,
      issuedMs,
      validUntilMs,
      severityValue: n.severity[severity],
      warningValue: n.warningLevel[warningLevel],
      activeIntensity: w.severity * n.severity[severity] + w.warningLevel * n.warningLevel[warningLevel],
    },
  };
}

/** Recency factor and status for one signal at `nowMs`. */
export function signalRecency(sig, nowMs, config) {
  const r = config.recency;
  if (nowMs < sig.issuedMs) return { status: 'NOT_YET_ISSUED', value: 0, hoursSinceIssue: hoursBetween(sig.issuedMs, nowMs) };
  const hoursSinceIssue = hoursBetween(sig.issuedMs, nowMs);
  if (nowMs <= sig.validUntilMs) {
    const decayHours = Math.max(0, hoursSinceIssue - r.freshHours);
    const value = Math.max(r.activeFloor, 0.5 ** (decayHours / r.activeHalfLifeHours));
    return { status: 'ACTIVE', value, hoursSinceIssue, hoursSinceExpiry: null };
  }
  const hoursSinceExpiry = hoursBetween(sig.validUntilMs, nowMs);
  if (hoursSinceExpiry > r.expiredCutoffHours) {
    return { status: 'EXPIRED', value: 0, hoursSinceIssue, hoursSinceExpiry };
  }
  const value = r.expiredResidual * 0.5 ** (hoursSinceExpiry / r.expiredHalfLifeHours);
  return { status: 'EXPIRED', value, hoursSinceIssue, hoursSinceExpiry };
}

/**
 * Pick the signal that drives risk: the latest ACTIVE signal if any, otherwise the latest
 * recently-expired one (residual only). Signals for other hazards are ignored (heatwave MVP).
 */
export function selectSignal(signals = [], { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const review = [];
  const valid = [];
  let ignoredOtherHazard = 0;

  for (const raw of signals) {
    const hazard = String(raw?.hazardType ?? '').toUpperCase();
    if (hazard !== config.hazardType) {
      ignoredOtherHazard += 1;
      continue;
    }
    const res = readSignal(raw, config);
    if (!res.ok) review.push(res.review);
    else valid.push(res.signal);
  }

  const issued = valid
    .filter((s) => s.issuedMs <= nowMs)
    .sort((a, b) => b.issuedMs - a.issuedMs || (a.id ?? '').localeCompare(b.id ?? ''));

  const withRecency = issued.map((s) => ({ ...s, recency: signalRecency(s, nowMs, config) }));
  const active = withRecency.find((s) => s.recency.status === 'ACTIVE');
  const selected = active ?? withRecency.find((s) => s.recency.value > 0) ?? null;
  const previous = selected ? withRecency.find((s) => s.issuedMs < selected.issuedMs) ?? null : null;

  return { selected, previous, review, ignoredOtherHazard, consideredCount: valid.length };
}

function deriveTrend(selected, previous, config) {
  if (selected.trend) return { trend: selected.trend, source: 'signal' };
  if (!previous) return { trend: 'STABLE', source: 'default (no earlier signal to compare)' };
  const diff = selected.activeIntensity - previous.activeIntensity;
  if (Math.abs(diff) < 1e-9) return { trend: 'STABLE', source: 'derived from previous signal' };
  return { trend: diff > 0 ? 'RISING' : 'FALLING', source: 'derived from previous signal' };
}

function readVulnerability(locality, config) {
  const pop = locality?.population;
  const vul = locality?.vulnerablePopulation;
  if (isFiniteNumber(pop) && pop > 0 && isFiniteNumber(vul) && vul >= 0 && vul <= pop) {
    return { value: vul / pop, assumed: false, method: 'vulnerablePopulation ÷ population', population: pop, vulnerablePopulation: vul };
  }
  const review =
    isFiniteNumber(pop) && isFiniteNumber(vul) && vul > pop
      ? { kind: 'locality', id: idOf(locality), reason: 'vulnerable population exceeds population' }
      : null;
  return {
    value: config.vulnerability.defaultValue,
    assumed: true,
    method: 'default (vulnerability data missing or invalid)',
    population: isFiniteNumber(pop) ? pop : null,
    vulnerablePopulation: isFiniteNumber(vul) ? vul : null,
    review,
  };
}

function readExposure(locality, config) {
  if (isUnit(locality?.exposureIndex)) {
    return { value: locality.exposureIndex, assumed: false, method: 'exposure index provided with locality context' };
  }
  const pop = locality?.population;
  const area = locality?.areaSqKm;
  if (isFiniteNumber(pop) && pop > 0 && isFiniteNumber(area) && area > 0) {
    const density = pop / area;
    return {
      value: clamp01(density / config.exposure.densityReferencePerSqKm),
      assumed: false,
      method: `population density ${Math.round(density)}/km² ÷ reference ${config.exposure.densityReferencePerSqKm}/km²`,
    };
  }
  return { value: config.exposure.defaultValue, assumed: true, method: 'default (no exposure index or density data)' };
}

/**
 * computeRisk({ locality, signals, criticalSites }, { now, config })
 * Returns hazard (with recency + trend), vulnerability, exposure and a 0–100 risk score.
 */
export function computeRisk({ locality, signals = [], criticalSites = [] } = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const pick = selectSignal(signals, { now: nowMs, config });
  const review = [...pick.review];
  const reasons = [];

  let hazard;
  if (!pick.selected) {
    hazard = {
      value: 0,
      status: 'NO_SIGNAL',
      intensity: 0,
      recency: 0,
      trend: null,
      trendMultiplier: 1,
      signal: null,
    };
    reasons.push('No valid heat signal is active for this locality, so hazard contributes nothing.');
  } else {
    const s = pick.selected;
    const isActive = s.recency.status === 'ACTIVE';
    // Expired signals are not active warnings: only residual severity counts.
    const intensity = isActive ? s.activeIntensity : config.hazard.weights.severity * s.severityValue;
    const { trend, source: trendSource } = deriveTrend(s, pick.previous, config);
    const trendMultiplier = config.normalisation.trend[trend];
    const value = intensity * s.recency.value * trendMultiplier;

    hazard = {
      value,
      status: s.recency.status,
      intensity,
      severity: s.severity,
      severityValue: s.severityValue,
      warningLevel: s.warningLevel,
      warningValue: isActive ? s.warningValue : 0,
      recency: s.recency.value,
      hoursSinceIssue: round(s.recency.hoursSinceIssue, 1),
      hoursSinceExpiry: s.recency.hoursSinceExpiry === null ? null : round(s.recency.hoursSinceExpiry, 1),
      trend,
      trendSource,
      trendMultiplier,
      signal: {
        id: s.id,
        source: s.raw.source ?? null,
        sourceUrl: s.raw.sourceUrl ?? null,
        label: s.raw.label ?? (s.raw.is_demo ? 'Demo' : null),
        is_demo: Boolean(s.raw.is_demo),
        sourceTimestamp: new Date(s.issuedMs).toISOString(),
        validUntil: new Date(s.validUntilMs).toISOString(),
      },
    };

    if (isActive) {
      reasons.push(
        `${s.severity} heat with a ${s.warningLevel} warning issued ${round(s.recency.hoursSinceIssue, 1)} h ago (recency ${round(s.recency.value, 2)}).`
      );
    } else {
      reasons.push(
        `The latest heat signal expired ${round(s.recency.hoursSinceExpiry, 1)} h ago. It is treated as residual heat context, not an active warning.`
      );
    }
    if (trend !== 'STABLE') reasons.push(`Trend is ${trend} (×${trendMultiplier}).`);
  }

  const vulnerability = readVulnerability(locality, config);
  if (vulnerability.review) review.push(vulnerability.review);
  delete vulnerability.review;
  const exposure = readExposure(locality, config);
  if (vulnerability.assumed) reasons.push('Vulnerability data is missing, so a default value is assumed.');
  if (exposure.assumed) reasons.push('Exposure data is missing, so a default value is assumed.');

  const w = config.risk.weights;
  const raw = w.hazard * Math.min(1, hazard.value) + w.vulnerability * vulnerability.value + w.exposure * exposure.value;
  const score = round(clamp01(raw) * 100, 1);

  return {
    score,
    hazard,
    vulnerability,
    exposure,
    criticalSiteCount: criticalSites.length,
    reasons,
    review,
    meta: { ignoredOtherHazardSignals: pick.ignoredOtherHazard, consideredSignals: pick.consideredCount },
  };
}
