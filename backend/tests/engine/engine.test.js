// Additional behaviour: determinism, bands, gaps, interventions, explanation, snapshots.
import { describe, it, expect } from 'vitest';
import {
  analyzeLocality,
  bandFor,
  GAP_TYPES,
  computeGaps,
  computeCoverage,
  communityConfirmationVerifies,
  ACTIVE_DEFAULT,
} from '../../src/engine/index.js';
import { NOW, rohiniScenario, localityA, localityB, hoursFromNow } from '../fixtures/scenarios.js';

const run = (input) => analyzeLocality(input, { now: NOW });

describe('determinism and purity', () => {
  it('returns byte-identical output for identical input', () => {
    expect(JSON.stringify(run(rohiniScenario()))).toBe(JSON.stringify(run(rohiniScenario())));
  });

  it('requires an explicit now', () => {
    expect(() => analyzeLocality(rohiniScenario(), {})).toThrow(/explicit/);
  });

  it('engine source has no I/O, randomness or wall-clock reads', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = new URL('../../src/engine/', import.meta.url);
    const banned = [/Math\.random/, /Date\.now\(/, /new Date\(\)/, /from ['"]mongoose['"]/, /from ['"]express['"]/, /process\.env/, /\bfetch\(/, /from ['"]node:fs['"]/];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
      const src = readFileSync(new URL(f, dir), 'utf8');
      for (const re of banned) expect(src, `${f} matches ${re}`).not.toMatch(re);
    }
  });
});

describe('bands (single canonical map, upper-inclusive)', () => {
  it('maps edges correctly', () => {
    expect(bandFor(0)).toBe('LOW');
    expect(bandFor(25)).toBe('LOW');
    expect(bandFor(25.1)).toBe('MODERATE');
    expect(bandFor(50)).toBe('MODERATE');
    expect(bandFor(75)).toBe('HIGH');
    expect(bandFor(75.1)).toBe('CRITICAL');
    expect(bandFor(100)).toBe('CRITICAL');
    expect(bandFor(null)).toBeNull();
  });
});

describe('gaps', () => {
  it('only emits the eight documented gap types, each with a plain-language message', () => {
    for (const f of [rohiniScenario, localityA, localityB]) {
      for (const g of run(f()).gaps) {
        expect(GAP_TYPES).toContain(g.code);
        expect(g.message.length).toBeGreaterThan(10);
      }
    }
  });

  it('Ward B shows missing cooling, a stale water point and an unresolved report; Ward A has no gaps', () => {
    const codes = run(localityB()).gaps.map((g) => `${g.code}:${g.service ?? ''}`);
    expect(codes).toEqual(expect.arrayContaining(['MISSING_RESOURCE:cooling', 'STALE_RESOURCE:water', 'UNRESOLVED_REPORT:']));
    expect(run(localityA()).gaps).toEqual([]);
  });

  it('flags a critical site with no usable support within the radius', () => {
    const r = run(rohiniScenario());
    const site = r.gaps.find((g) => g.code === 'UNSUPPORTED_CRITICAL_SITE');
    expect(site.siteId).toBe('site-rohini-hospital');
    expect(site.detail.checks.find((c) => c.service === 'water').nearestMeters).toBeGreaterThan(750);
  });

  it('ignores expired and resolved reports', () => {
    const input = localityB();
    input.reports = [
      { id: 'x1', type: 'NO_SHADE', status: 'OPEN', expiresAt: hoursFromNow(-1) },
      { id: 'x2', type: 'NO_SHADE', status: 'RESOLVED', expiresAt: hoursFromNow(10) },
    ];
    const cov = computeCoverage(input, { now: NOW });
    expect(computeGaps({ coverage: cov, reports: input.reports }, { now: NOW }).some((g) => g.code === 'UNRESOLVED_REPORT')).toBe(false);
  });

  it('marks an inaccessible resource', () => {
    const input = localityA();
    input.resources[0].accessibility = 0.3;
    expect(run(input).gaps.some((g) => g.code === 'INACCESSIBLE_RESOURCE' && g.resourceId === 'res-a-water-1')).toBe(true);
  });
});

describe('interventions', () => {
  it('are recommendations that always require approval, ranked by modelled effect', () => {
    const list = run(rohiniScenario()).interventions;
    expect(list.length).toBeGreaterThan(3);
    for (const a of list) {
      expect(a.status).toBe('RECOMMENDED');
      expect(a.requiresApproval).toBe(true);
      expect(a.label).toBe('Modelled');
    }
    const reductions = list.map((a) => a.expectedEffect.priorityReduction);
    expect([...reductions].sort((x, y) => y - x)).toEqual(reductions);
    expect(list[0].code).toBe('DEPLOY_WATER_TANKER');
  });

  it('includes re-verification for stale resources and site support for critical sites', () => {
    expect(run(localityB()).interventions.map((a) => a.code)).toContain('REVERIFY_RESOURCE');
    expect(run(rohiniScenario()).interventions.map((a) => a.code)).toContain('SUPPORT_CRITICAL_SITE');
  });

  it('a tanker sized by the engine closes the water gap in a what-if', () => {
    const r = run(rohiniScenario());
    const tanker = r.interventions.find((a) => a.code === 'DEPLOY_WATER_TANKER');
    expect(tanker.expectedEffect.serviceCoveragePct.after).toBe(100);
  });

  it('nothing is recommended when there are no gaps', () => {
    expect(run(localityA()).interventions).toEqual([]);
  });
});

describe('explanation and snapshot', () => {
  it('explains the score with factors, formulas, assumptions and limitations', () => {
    const e = run(rohiniScenario()).explanation;
    expect(e.summary).toMatch(/CRITICAL/);
    expect(e.factorBreakdown.map((f) => f.key)).toEqual(['hazard', 'deficit', 'vulnerability', 'exposure']);
    expect(e.formulas.effectiveCapacity).toMatch(/reliability × accessibility/);
    expect(e.assumptions.length).toBeGreaterThan(4);
    expect(e.limitations.join(' ')).toMatch(/not a weather forecast/i);
    expect(e.methodologyPath).toBe('/methodology');
  });

  it('builds a README-shaped snapshot labelled Modelled with is_demo propagated', () => {
    const s = run(rohiniScenario()).snapshot;
    for (const key of ['localityId', 'computedAt', 'risk', 'vulnerability', 'exposure', 'coverage', 'deficit', 'recency', 'trend', 'score', 'band', 'coverageByType', 'gapReasons', 'factorBreakdown', 'configVersion']) {
      expect(s).toHaveProperty(key);
    }
    expect(s.label).toBe('Modelled');
    expect(s.is_demo).toBe(true);
    expect(s.configVersion).toBe(ACTIVE_DEFAULT.version);
    expect(JSON.stringify(s)).not.toMatch(/_coverageExact|_deficitExact/);
  });
});

describe('human in the loop', () => {
  it('community confirmations never verify on their own', () => {
    expect(communityConfirmationVerifies()).toBe(false);
  });
});
