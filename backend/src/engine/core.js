// Core pipeline shared by analyzeLocality, interventions and what-if:
// risk → coverage → gaps → priority. Pure and deterministic.
import { resolveConfig } from './scoring.config.js';
import { requireNow, idOf } from './util.js';
import { computeRisk } from './risk.engine.js';
import { computeCoverage } from './coverage.engine.js';
import { computeGaps } from './gap.engine.js';
import { computePriority } from './priority.engine.js';

/**
 * input: { locality, signals, resources, criticalSites, reports }
 * opts:  { now, config }
 */
export function computeCore(input = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const opts = { now: nowMs, config };
  const { locality = null, signals = [], resources = [], criticalSites = [], reports = [] } = input;

  const review = [];
  if (!locality || idOf(locality) === null) {
    review.push({ kind: 'locality', id: null, reason: 'locality record is missing or has no id' });
  }

  const risk = computeRisk({ locality, signals, criticalSites }, opts);
  const coverage = computeCoverage({ locality, resources }, opts);
  const gaps = computeGaps({ coverage, criticalSites, reports }, opts);
  const priority = computePriority({ risk, coverage, gaps }, opts);

  return {
    risk,
    coverage,
    gaps,
    priority,
    review: [...review, ...risk.review, ...coverage.review],
    config,
    nowMs,
  };
}
