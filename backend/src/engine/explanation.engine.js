// Explanation engine: builds the "Why this score" trail from a core result.
import { round, formatNumber } from './util.js';
import { SERVICES } from './scoring.config.js';

export const FORMULAS = Object.freeze({
  hazard:
    'hazard = (w_severity × severity + w_warning × warningLevel) × recency × trend   [expired: warning term = 0]',
  risk: 'risk = 100 × clamp01(w_h × min(1, hazard) + w_v × vulnerability + w_e × exposure)',
  effectiveCapacity: 'effectiveCapacity = capacity × reliability × accessibility × availabilityFactor',
  availabilityFactor: 'availabilityFactor = availability × operationalStatus × freshness (stale / unverified)',
  coverage: 'coverage % = min(1, effectiveCapacity ÷ requiredCapacity) × 100;  deficit % = 100 − coverage %',
  overallCoverage: 'overall coverage % = Σ serviceWeight × service coverage %',
  priority:
    'priority = clamp(0, 100, 100 × Σ w_i × factor_i + modifiers)   factors: hazard, deficit, vulnerability, exposure',
});

export const LIMITATIONS = Object.freeze([
  'Decision support for triage only. Not a weather forecast, health-risk prediction or validated measure of harm.',
  'Service standards and weights are illustrative assumptions until replaced with curated standards.',
  'Coverage depends on how complete and current the resource listings are.',
  'Recommendations need coordinator or admin approval. Nothing is dispatched automatically.',
  'Each recommendation’s modelled effect is estimated on its own; effects are not additive.',
  'Demo records describe fictional localities and are not assessments of real places.',
]);

export function buildAssumptions(core) {
  const { config, risk } = core;
  const a = [];
  for (const s of SERVICES) {
    const svc = config.coverage.services[s];
    a.push(
      `${svc.label}: ${svc.ratePerPerson} ${svc.unit.replace('/day', '')} per ${svc.basis === 'population' ? 'resident' : 'vulnerable resident'} per day; weight ${round(svc.weight, 3)}.`
    );
  }
  a.push(
    `Stale listings (unverified for more than ${config.coverage.staleAfterDays} days) count for ${config.coverage.staleFactor * 100}% of capacity.`
  );
  a.push(
    `Recency: full weight for ${config.recency.freshHours} h, then halves every ${config.recency.activeHalfLifeHours} h (floor ${config.recency.activeFloor}) while valid; after expiry ${config.recency.expiredResidual} residual, halving every ${config.recency.expiredHalfLifeHours} h, ignored after ${config.recency.expiredCutoffHours} h.`
  );
  a.push(`Critical sites need usable support within ${config.gaps.supportRadiusMeters} m.`);
  if (risk.vulnerability.assumed) a.push(`Vulnerability assumed at ${config.vulnerability.defaultValue} (data missing).`);
  if (risk.exposure.assumed) a.push(`Exposure assumed at ${config.exposure.defaultValue} (data missing).`);
  return a;
}

export function explain(core) {
  const { priority, risk, coverage, gaps } = core;
  const reasons = [...risk.reasons];

  let summary;
  if (priority.status !== 'OK') {
    summary = `Not scored: ${priority.reason}`;
  } else {
    const top = [...priority.factors].sort((x, y) => y.points - x.points).slice(0, 2);
    summary = `Priority ${priority.band} (${priority.score}/100). Largest contributors: ${top
      .map((f) => `${f.label.split(' (')[0].toLowerCase()} (+${round(f.points, 1)})`)
      .join(' and ')}.`;
    for (const s of SERVICES) {
      const c = coverage.byService[s];
      if (c.coveragePct !== null && c.coveragePct < 100) {
        reasons.push(
          `${c.label}: ${c.coveragePct}% covered (${formatNumber(c.effective)} of ${formatNumber(c.required)} ${c.unit} effective).`
        );
      }
    }
    for (const m of priority.modifiers) if (m.points > 0) reasons.push(`${m.label}: ${m.count} (+${m.points}).`);
  }
  for (const g of gaps.filter((x) => x.severity === 'HIGH').slice(0, 5)) reasons.push(g.message);

  return {
    summary,
    reasons,
    factorBreakdown: priority.factors ?? [],
    modifiers: priority.modifiers ?? [],
    formulas: FORMULAS,
    assumptions: buildAssumptions(core),
    limitations: [...LIMITATIONS],
    methodologyPath: '/methodology',
  };
}
