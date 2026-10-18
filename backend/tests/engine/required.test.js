// The nine golden tests required by the specification, plus the Rohini worked numbers.
import { describe, it, expect } from 'vitest';
import {
  analyzeLocality,
  computeRisk,
  computeCoverage,
  runWhatIf,
  validateConfig,
  assertTransition,
  DEFAULT_CONFIG,
  ConfigError,
  TransitionError,
} from '../../src/engine/index.js';
import { deepFreeze } from '../../src/engine/util.js';
import { NOW, rohiniScenario, localityA, localityB, heatSignal, hoursFromNow, daysAgo } from '../fixtures/scenarios.js';

const run = (input, opts = {}) => analyzeLocality(input, { now: NOW, ...opts });

describe('Rohini demo scenario (spec numbers)', () => {
  it('computes effective capacity 3,900 L/day and water coverage 15.6%', () => {
    const r = run(rohiniScenario());
    const water = r.coverage.byService.water;
    expect(water.required).toBe(25000);
    expect(water.effective).toBeCloseTo(3900, 6);
    expect(water.coveragePct).toBe(15.6);
    expect(water.deficitPct).toBe(84.4);
  });

  it('is labelled Modelled, flagged demo, versioned, and never a hardcoded score', () => {
    const r = run(rohiniScenario());
    expect(r.label).toBe('Modelled');
    expect(r.meta.is_demo).toBe(true);
    expect(r.meta.configVersion).toBe(DEFAULT_CONFIG.version);
    // The score is the sum of its visible parts.
    const sum = r.priority.factors.reduce((s, f) => s + f.points, 0) + r.priority.modifiers.reduce((s, m) => s + m.points, 0);
    expect(r.priority.score).toBeCloseTo(Math.min(100, sum), 0);
  });
});

describe('1. Same signal + different resources → different priorities', () => {
  it('Ward A and Ward B share the warning and risk but not the priority', () => {
    const a = run(localityA());
    const b = run(localityB());
    expect(a.risk.hazard.severity).toBe(b.risk.hazard.severity);
    expect(a.risk.hazard.warningLevel).toBe(b.risk.hazard.warningLevel);
    expect(a.risk.score).toBe(b.risk.score);
    expect(b.priority.score).toBeGreaterThan(a.priority.score);
    expect(b.priority.band).not.toBe(a.priority.band);
    // The difference is explained by the deficit factor.
    const deficit = (x) => x.priority.factors.find((f) => f.key === 'deficit').points;
    expect(deficit(b)).toBeGreaterThan(deficit(a));
  });
});

describe('2. Expired signals decay and are not active warnings', () => {
  const at = (validUntilOffset, issuedOffset = -20) =>
    computeRisk(
      { locality: localityA().locality, signals: [heatSignal({ sourceTimestamp: hoursFromNow(issuedOffset), validUntil: hoursFromNow(validUntilOffset) })] },
      { now: NOW }
    ).hazard;

  it('active > just expired > long expired > beyond cutoff (0)', () => {
    const active = at(+2);
    const justExpired = at(-1);
    const longExpired = at(-12);
    const gone = at(-60, -80);
    expect(active.status).toBe('ACTIVE');
    expect(justExpired.status).toBe('EXPIRED');
    expect(active.value).toBeGreaterThan(justExpired.value);
    expect(justExpired.value).toBeGreaterThan(longExpired.value);
    expect(gone.value).toBe(0);
  });

  it('drops the warning-level component once expired', () => {
    const expired = at(-1);
    expect(expired.warningValue).toBe(0);
    expect(expired.intensity).toBeCloseTo(0.5 * 0.75, 10); // severity term only
  });

  it('prefers a still-valid older signal over a newer expired one', () => {
    const signals = [
      heatSignal({ id: 'old-valid', sourceTimestamp: hoursFromNow(-10), validUntil: hoursFromNow(10) }),
      heatSignal({ id: 'new-expired', sourceTimestamp: hoursFromNow(-4), validUntil: hoursFromNow(-1) }),
    ];
    const h = computeRisk({ locality: localityA().locality, signals }, { now: NOW }).hazard;
    expect(h.signal.id).toBe('old-valid');
    expect(h.status).toBe('ACTIVE');
  });
});

describe('3. Stale or non-operational resources add little capacity', () => {
  const base = {
    id: 'r1', type: 'WATER_POINT', unit: 'L/day', capacity: 10000, reliability: 1, accessibility: 1,
    availability: 'AVAILABLE', status: 'OPERATIONAL', verificationStatus: 'VERIFIED', lastVerifiedAt: daysAgo(1),
  };
  const eff = (patch) =>
    computeCoverage({ locality: localityA().locality, resources: [{ ...base, ...patch }] }, { now: NOW }).byService.water.effective;

  it('applies the stale factor, and zero for unavailable / non-operational', () => {
    expect(eff({})).toBe(10000);
    expect(eff({ lastVerifiedAt: daysAgo(30) })).toBe(2500);
    expect(eff({ verificationStatus: 'STALE' })).toBe(2500);
    expect(eff({ status: 'NON_OPERATIONAL' })).toBe(0);
    expect(eff({ availability: 'UNAVAILABLE' })).toBe(0);
    expect(eff({ status: 'DEGRADED' })).toBe(5000);
  });
});

describe('4. A verified resource improves modelled coverage', () => {
  it('re-verifying Ward B’s stale water point raises water coverage and lowers priority', () => {
    const input = localityB();
    const before = run(input);
    input.resources[0].lastVerifiedAt = NOW;
    const after = run(input);
    expect(after.coverage.byService.water.coveragePct).toBeGreaterThan(before.coverage.byService.water.coveragePct);
    expect(after.priority.score).toBeLessThan(before.priority.score);
    expect(after.gaps.some((g) => g.code === 'STALE_RESOURCE')).toBe(false);
  });

  it('adding a verified water point to Rohini improves coverage', () => {
    const input = rohiniScenario();
    const before = run(input);
    input.resources.push({
      id: 'res-new', type: 'WATER_POINT', unit: 'L/day', capacity: 10000, reliability: 0.9, accessibility: 0.9,
      availability: 'AVAILABLE', status: 'OPERATIONAL', verificationStatus: 'VERIFIED', lastVerifiedAt: NOW,
    });
    const after = run(input);
    expect(after.coverage.byService.water.coveragePct).toBeCloseTo(15.6 + 32.4, 1);
    expect(after.priority.score).toBeLessThan(before.priority.score);
  });
});

describe('5. Rising trend affects the score deterministically', () => {
  const withTrend = (trend) => {
    const input = localityB();
    input.signals[0].trend = trend;
    return run(input).priority.score;
  };
  it('RISING > STABLE > FALLING, identical on repeat', () => {
    const rising = withTrend('RISING');
    const stable = withTrend('STABLE');
    const falling = withTrend('FALLING');
    expect(rising).toBeGreaterThan(stable);
    expect(stable).toBeGreaterThan(falling);
    expect(withTrend('RISING')).toBe(rising);
  });

  it('derives the trend from the previous signal when none is given', () => {
    const signals = [
      heatSignal({ id: 'prev', severity: 'MODERATE', trend: null, sourceTimestamp: hoursFromNow(-30), validUntil: hoursFromNow(-20) }),
      heatSignal({ id: 'now', severity: 'EXTREME', trend: null }),
    ];
    const h = computeRisk({ locality: localityA().locality, signals }, { now: NOW }).hazard;
    expect(h.trend).toBe('RISING');
    expect(h.trendSource).toMatch(/derived/);
  });
});

describe('6. Weights are validated and normalised', () => {
  const clone = () => structuredClone(DEFAULT_CONFIG);

  it('normalises weights that do not sum to 1, with a warning', () => {
    const cfg = clone();
    cfg.priority.weights = { hazard: 2, deficit: 2, vulnerability: 1, exposure: 1 };
    const { config, warnings } = validateConfig(cfg);
    expect(config.priority.weights.hazard).toBeCloseTo(1 / 3, 10);
    expect(Object.values(config.priority.weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(warnings.join(' ')).toMatch(/priority\.weights/);
  });

  it('gives the same result for proportionally scaled weights', () => {
    const cfg = clone();
    cfg.priority.weights = { hazard: 35, deficit: 35, vulnerability: 15, exposure: 15 };
    expect(run(localityB(), { config: cfg }).priority.score).toBe(run(localityB()).priority.score);
  });

  it('rejects negative weights, all-zero weights, unknown keys and broken bands', () => {
    const neg = clone();
    neg.priority.weights.hazard = -0.1;
    expect(() => validateConfig(neg)).toThrow(ConfigError);

    const zero = clone();
    zero.risk.weights = { hazard: 0, vulnerability: 0, exposure: 0 };
    expect(() => validateConfig(zero)).toThrow(/sum to more than 0/);

    const extra = clone();
    extra.priority.weights.mystery = 0.2;
    expect(() => validateConfig(extra)).toThrow(ConfigError);

    const bands = clone();
    bands.priority.bands = [{ band: 'LOW', max: 50 }, { band: 'HIGH', max: 40 }, { band: 'CRITICAL', max: 100 }];
    expect(() => validateConfig(bands)).toThrow(/ascending/);

    const short = clone();
    short.priority.bands = [{ band: 'LOW', max: 25 }, { band: 'HIGH', max: 90 }];
    expect(() => validateConfig(short)).toThrow(/end at 100/);

    const missingEnum = clone();
    delete missingEnum.normalisation.severity.EXTREME;
    expect(() => validateConfig(missingEnum)).toThrow(/EXTREME/);
  });
});

describe('7. Unmapped records go to review instead of being guessed', () => {
  it('sends unknown resource types, wrong units and bad values to review', () => {
    const input = localityA();
    input.resources.push(
      { id: 'bad-type', type: 'ICE_CREAM_VAN', unit: 'L/day', capacity: 100, reliability: 1, accessibility: 1 },
      { id: 'bad-unit', type: 'WATER_POINT', unit: 'gallons', capacity: 100, reliability: 1, accessibility: 1 },
      { id: 'bad-rel', type: 'WATER_POINT', unit: 'L/day', capacity: 100, reliability: 1.4, accessibility: 1 }
    );
    const r = run(input);
    const ids = r.review.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(['bad-type', 'bad-unit', 'bad-rel']));
    // They contribute nothing.
    expect(r.coverage.byService.water.effective).toBe(run(localityA()).coverage.byService.water.effective);
  });

  it('sends signals with unknown enums to review and ignores them', () => {
    const input = localityA();
    input.signals = [heatSignal({ id: 'weird', severity: 'SCORCHING' })];
    const r = run(input);
    expect(r.review).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'climateSignal', id: 'weird' })]));
    expect(r.risk.hazard.status).toBe('NO_SIGNAL');
  });

  it('does not score a locality whose demand cannot be computed', () => {
    const input = localityA();
    delete input.locality.population;
    const r = run(input);
    expect(r.priority.status).toBe('NEEDS_REVIEW');
    expect(r.priority.score).toBeNull();
    expect(r.priority.band).toBeNull();
    expect(r.review.some((x) => x.kind === 'locality')).toBe(true);
  });
});

describe('8. What-if has no side effects', () => {
  it('never mutates deeply frozen inputs and reports persisted:false', () => {
    const input = deepFreeze(localityB());
    const snapshot = JSON.stringify(input);
    const result = runWhatIf(
      input,
      [
        { op: 'add', resource: { type: 'WATER_TANKER', unit: 'L/day', capacity: 20000, reliability: 0.9, accessibility: 0.9, verificationStatus: 'VERIFIED', lastVerifiedAt: NOW } },
        { op: 'update', id: 'res-b-water-1', patch: { lastVerifiedAt: NOW } },
      ],
      { now: NOW }
    );
    expect(JSON.stringify(input)).toBe(snapshot);
    expect(result.persisted).toBe(false);
    expect(result.label).toBe('Modelled');
    expect(result.after.priority.score).toBeLessThan(result.before.priority.score);
    expect(result.delta.byService.water).toBeGreaterThan(0);
    // "before" equals a plain analysis of the untouched input.
    expect(result.before.priority.score).toBe(run(localityB()).priority.score);
  });

  it('rejects unknown resources and fields that a what-if may not change', () => {
    expect(() => runWhatIf(localityB(), [{ op: 'update', id: 'nope', patch: {} }], { now: NOW })).toThrow(/not in this locality/);
    expect(() => runWhatIf(localityB(), [{ op: 'update', id: 'res-b-water-1', patch: { is_demo: false } }], { now: NOW })).toThrow(/not allowed/);
  });
});

describe('9. Illegal state transitions fail', () => {
  it('rejects skipping steps and leaving terminal states', () => {
    for (const [from, to] of [
      ['RECOMMENDED', 'ASSIGNED'],
      ['RECOMMENDED', 'VERIFIED'],
      ['APPROVED', 'COMPLETED'],
      ['COMPLETED', 'VERIFIED'],
      ['CLOSED', 'APPROVED'],
      ['REJECTED', 'APPROVED'],
      ['VERIFIED', 'IN_PROGRESS'],
    ]) {
      expect(() => assertTransition(from, to, { reason: 'x' })).toThrow(TransitionError);
    }
    try {
      assertTransition('RECOMMENDED', 'ASSIGNED');
    } catch (e) {
      expect(e.code).toBe('ILLEGAL_TRANSITION');
      expect(e.status).toBe(409);
    }
  });

  it('walks the full legal path with evidence-based verification', () => {
    const path = ['RECOMMENDED', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFICATION_PENDING', 'VERIFIED', 'CLOSED'];
    const ctx = { evidence: ['photo-1'], result: 'SUCCESS', verifierId: 'coord-1', completedById: 'resp-1' };
    for (let i = 0; i < path.length - 1; i++) expect(assertTransition(path[i], path[i + 1], ctx)).toBe(true);
  });

  it('requires evidence, a passing result and an independent verifier', () => {
    const base = { result: 'SUCCESS', verifierId: 'coord-1', completedById: 'resp-1' };
    expect(() => assertTransition('VERIFICATION_PENDING', 'VERIFIED', { ...base, evidence: [] })).toThrow(/evidence/);
    expect(() => assertTransition('VERIFICATION_PENDING', 'VERIFIED', { ...base, evidence: ['p'], result: 'FAILED' })).toThrow(TransitionError);
    expect(() => assertTransition('VERIFICATION_PENDING', 'VERIFIED', { ...base, evidence: ['p'], verifierId: 'resp-1' })).toThrow(/cannot verify/);
    expect(() => assertTransition('VERIFICATION_PENDING', 'IN_PROGRESS', { result: 'SUCCESS' })).toThrow(TransitionError);
    expect(assertTransition('VERIFICATION_PENDING', 'IN_PROGRESS', { result: 'FAILED' })).toBe(true);
    expect(() => assertTransition('RECOMMENDED', 'REJECTED', {})).toThrow(/reason/);
  });
});
