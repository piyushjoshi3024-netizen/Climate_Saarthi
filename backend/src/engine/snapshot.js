// Builds the persisted PrioritySnapshot shape (README §5) from an analysis. Pure.
import { SERVICES } from './scoring.config.js';
import { round } from './util.js';

export function buildSnapshot(analysis) {
  const { localityId, computedAt, risk, coverage, gaps, priority, explanation, meta } = analysis;
  return {
    localityId,
    computedAt,
    label: 'Modelled',
    is_demo: meta.is_demo,
    engineVersion: meta.engineVersion,
    configVersion: meta.configVersion,
    status: priority.status,
    score: priority.score,
    band: priority.band,
    risk: risk.score,
    hazard: round(risk.hazard.value, 4),
    signalStatus: risk.hazard.status,
    signalId: risk.hazard.signal?.id ?? null,
    vulnerability: round(risk.vulnerability.value, 4),
    exposure: round(risk.exposure.value, 4),
    recency: round(risk.hazard.recency, 4),
    trend: risk.hazard.trend,
    coverage: coverage.overall.coveragePct,
    deficit: coverage.overall.deficitPct,
    coverageByType: Object.fromEntries(
      SERVICES.map((s) => {
        const c = coverage.byService[s];
        return [s, { coveragePct: c.coveragePct, deficitPct: c.deficitPct, effective: c.effective, required: c.required, unit: c.unit }];
      })
    ),
    gapReasons: gaps.map((g) => ({ code: g.code, severity: g.severity, message: g.message })),
    factorBreakdown: priority.factors,
    modifiers: priority.modifiers,
    reasons: explanation.reasons,
    assumptions: explanation.assumptions,
  };
}
