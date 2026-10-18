// Response Intelligence Engine — public entry point.
// Pure and deterministic: no Express, no database, no randomness, no wall-clock reads.
// Every result carries timestamps, engine/config versions, factors, reasons and an
// explanation trail, and is labelled Modelled.
import { resolveConfig, ENGINE_VERSION, SERVICES } from './scoring.config.js';
import { requireNow, idOf } from './util.js';
import { computeCore } from './core.js';
import { recommendInterventions } from './intervention.engine.js';
import { explain } from './explanation.engine.js';
import { buildSnapshot } from './snapshot.js';

/** Strip internal precision fields (prefixed "_") from coverage output. */
function publicCoverage(coverage) {
  const byService = {};
  for (const s of SERVICES) {
    const { _coverageExact, ...rest } = coverage.byService[s];
    byService[s] = rest;
  }
  const { _deficitExact, ...overall } = coverage.overall;
  return { byService, overall };
}

/**
 * analyzeLocality(input, { now, config })
 * input: { locality, signals, resources, criticalSites, reports }
 */
export function analyzeLocality(input = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const core = computeCore(input, { now: nowMs, config });
  const interventions = recommendInterventions(input, core, { now: nowMs, config });
  const explanation = explain(core);

  const isDemo =
    Boolean(input.locality?.is_demo) ||
    (input.signals ?? []).some((s) => s?.is_demo) ||
    (input.resources ?? []).some((r) => r?.is_demo);

  const analysis = {
    localityId: idOf(input.locality),
    localityName: input.locality?.name ?? null,
    computedAt: new Date(nowMs).toISOString(),
    label: 'Modelled',
    risk: core.risk,
    coverage: publicCoverage(core.coverage),
    gaps: core.gaps,
    priority: core.priority,
    interventions,
    explanation,
    review: core.review,
    meta: {
      engineVersion: ENGINE_VERSION,
      configVersion: config.version,
      is_demo: isDemo,
      methodologyPath: '/methodology',
    },
  };
  return { ...analysis, snapshot: buildSnapshot(analysis) };
}

export { computeCore } from './core.js';
export { computeRisk, selectSignal, signalRecency } from './risk.engine.js';
export { computeCoverage, analyseResource } from './coverage.engine.js';
export { computeGaps, GAP_TYPES } from './gap.engine.js';
export { computePriority } from './priority.engine.js';
export { recommendInterventions } from './intervention.engine.js';
export { runWhatIf, applyChanges, WhatIfError } from './whatif.engine.js';
export { explain, FORMULAS, LIMITATIONS } from './explanation.engine.js';
export { buildSnapshot } from './snapshot.js';
export {
  STATES,
  TRANSITIONS,
  TERMINAL_STATES,
  VERIFICATION_RESULTS,
  canTransition,
  assertTransition,
  TransitionError,
  communityConfirmationVerifies,
} from './state.machine.js';
export {
  DEFAULT_CONFIG,
  ACTIVE_DEFAULT,
  ENGINE_VERSION,
  SERVICES,
  validateConfig,
  resolveConfig,
  bandFor,
  ConfigError,
} from './scoring.config.js';
