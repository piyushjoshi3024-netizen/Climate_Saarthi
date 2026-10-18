// Priority engine.
//   base   = Σ weight_i × factor_i × 100      factors: hazard, deficit, vulnerability, exposure (0..1)
//   score  = clamp(0, 100, base + modifiers)   modifiers: unsupported critical sites, unresolved reports
//   band   = first configured band with score ≤ max
// hazard already includes recency decay and the trend multiplier (so it may exceed 1 when RISING).
import { resolveConfig, bandFor } from './scoring.config.js';
import { requireNow, clamp, round } from './util.js';
import { countUnsupportedSites, countUnresolvedReports } from './gap.engine.js';

export function computePriority({ risk, coverage, gaps = [] } = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const w = config.priority.weights;
  const computedAt = new Date(nowMs).toISOString();

  const deficit = coverage?.overall?._deficitExact ?? null;
  if (deficit === null) {
    return {
      status: 'NEEDS_REVIEW',
      score: null,
      band: null,
      factors: [],
      modifiers: [],
      reason: 'Coverage could not be computed (locality demand data missing). Not scored rather than guessed.',
      computedAt,
      configVersion: config.version,
    };
  }

  const factorInputs = [
    {
      key: 'hazard',
      label: 'Heat hazard (signal × recency × trend)',
      value: risk.hazard.value,
      detail:
        risk.hazard.status === 'NO_SIGNAL'
          ? 'No valid heat signal'
          : `${risk.hazard.severity}/${risk.hazard.warningLevel} · intensity ${round(risk.hazard.intensity, 3)} × recency ${round(risk.hazard.recency, 3)} × trend ${risk.hazard.trendMultiplier} (${risk.hazard.status})`,
    },
    {
      key: 'deficit',
      label: 'Response deficit (100 − weighted coverage)',
      value: deficit,
      detail: `Overall coverage ${coverage.overall.coveragePct}% → deficit ${coverage.overall.deficitPct}%`,
    },
    {
      key: 'vulnerability',
      label: 'Vulnerability (share of vulnerable residents)',
      value: risk.vulnerability.value,
      detail: risk.vulnerability.method,
    },
    { key: 'exposure', label: 'Exposure', value: risk.exposure.value, detail: risk.exposure.method },
  ];

  const factors = factorInputs.map((f) => {
    const points = w[f.key] * f.value * 100;
    return { ...f, value: round(f.value, 4), weight: round(w[f.key], 4), points: round(points, 2), _points: points };
  });
  const base = factors.reduce((s, f) => s + f._points, 0);

  const m = config.priority.modifiers;
  const sites = countUnsupportedSites(gaps);
  const reports = countUnresolvedReports(gaps);
  const modifiers = [
    {
      key: 'unsupportedCriticalSite',
      label: 'Unsupported critical sites',
      count: sites,
      points: Math.min(m.unsupportedCriticalSite.max, sites * m.unsupportedCriticalSite.pointsEach),
      rule: `+${m.unsupportedCriticalSite.pointsEach} per site, max +${m.unsupportedCriticalSite.max}`,
    },
    {
      key: 'unresolvedReport',
      label: 'Unresolved ground reports',
      count: reports,
      points: Math.min(m.unresolvedReport.max, reports * m.unresolvedReport.pointsEach),
      rule: `+${m.unresolvedReport.pointsEach} per report, max +${m.unresolvedReport.max}`,
    },
  ];
  const modifierPoints = modifiers.reduce((s, x) => s + x.points, 0);

  const exact = clamp(base + modifierPoints, 0, 100);
  const score = round(exact, 1);

  return {
    status: 'OK',
    score,
    band: bandFor(score, config),
    base: round(base, 2),
    modifierPoints: round(modifierPoints, 2),
    capped: base + modifierPoints > 100,
    factors: factors.map(({ _points, ...f }) => f),
    modifiers,
    computedAt,
    configVersion: config.version,
  };
}
