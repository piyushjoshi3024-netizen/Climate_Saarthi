// What-if engine: applies hypothetical resource changes to a deep COPY of the inputs and
// returns before/after estimates. It never mutates its inputs and performs no I/O, so it
// cannot write to MongoDB or touch any cache. Output is always labelled Modelled.
import { computeCore } from './core.js';
import { requireNow, idOf, round } from './util.js';
import { SERVICES, resolveConfig } from './scoring.config.js';

export class WhatIfError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'WhatIfError';
    this.code = code;
  }
}

const ALLOWED_PATCH = new Set([
  'capacity', 'reliability', 'accessibility', 'availability', 'status',
  'verificationStatus', 'lastVerifiedAt', 'unit', 'name', 'location',
]);

/**
 * Apply changes to a cloned input.
 * changes: [{ op:'add', resource }, { op:'update', id, patch }, { op:'remove', id }]
 */
export function applyChanges(input, changes = []) {
  if (!Array.isArray(changes)) throw new WhatIfError('WHATIF_INVALID', 'changes must be an array');
  const next = structuredClone({ ...input, resources: input.resources ?? [] });
  let added = 0;

  changes.forEach((ch, i) => {
    const op = ch?.op;
    if (op === 'add') {
      if (!ch.resource || typeof ch.resource !== 'object') {
        throw new WhatIfError('WHATIF_INVALID', `change ${i}: add needs a resource object`);
      }
      added += 1;
      next.resources.push({
        ...structuredClone(ch.resource),
        id: ch.resource.id ?? `whatif-${added}`,
        localityId: ch.resource.localityId ?? idOf(input.locality),
        is_hypothetical: true,
      });
    } else if (op === 'update' || op === 'remove') {
      const idx = next.resources.findIndex((r) => idOf(r) === String(ch.id));
      if (idx === -1) throw new WhatIfError('WHATIF_UNKNOWN_RESOURCE', `change ${i}: resource ${ch.id} is not in this locality`);
      if (op === 'remove') {
        next.resources.splice(idx, 1);
      } else {
        const patch = ch.patch ?? {};
        const bad = Object.keys(patch).filter((k) => !ALLOWED_PATCH.has(k));
        if (bad.length) throw new WhatIfError('WHATIF_INVALID', `change ${i}: fields not allowed in a what-if: ${bad.join(', ')}`);
        next.resources[idx] = { ...next.resources[idx], ...structuredClone(patch), is_hypothetical: true };
      }
    } else {
      throw new WhatIfError('WHATIF_INVALID', `change ${i}: unknown op "${op}"`);
    }
  });
  return next;
}

/** Compact, comparable view of a core result. */
export function summarise(core) {
  return {
    priority: { status: core.priority.status, score: core.priority.score, band: core.priority.band },
    riskScore: core.risk.score,
    coverage: {
      overallPct: core.coverage.overall.coveragePct,
      deficitPct: core.coverage.overall.deficitPct,
      byService: Object.fromEntries(
        SERVICES.map((s) => {
          const c = core.coverage.byService[s];
          return [s, { coveragePct: c.coveragePct, deficitPct: c.deficitPct, effective: c.effective, required: c.required, unit: c.unit }];
        })
      ),
    },
    gapCount: core.gaps.length,
    gapKeys: core.gaps.map((g) => g.key),
  };
}

const diff = (a, b) => (a === null || b === null || a === undefined || b === undefined ? null : round(b - a, 1));

export function compare(before, after) {
  const beforeKeys = new Set(before.gapKeys);
  const afterKeys = new Set(after.gapKeys);
  return {
    priorityScore: diff(before.priority.score, after.priority.score),
    bandChanged: before.priority.band !== after.priority.band,
    overallCoveragePct: diff(before.coverage.overallPct, after.coverage.overallPct),
    deficitPct: diff(before.coverage.deficitPct, after.coverage.deficitPct),
    byService: Object.fromEntries(
      SERVICES.map((s) => [s, diff(before.coverage.byService[s].coveragePct, after.coverage.byService[s].coveragePct)])
    ),
    gapsResolved: before.gapKeys.filter((k) => !afterKeys.has(k)),
    gapsAdded: after.gapKeys.filter((k) => !beforeKeys.has(k)),
  };
}

/**
 * runWhatIf(input, changes, { now, config })
 * Returns { before, after, delta, label:'Modelled', persisted:false, ... }.
 */
export function runWhatIf(input, changes, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const opts = { now: nowMs, config };
  const beforeCore = computeCore(input, opts);
  const afterInput = applyChanges(input, changes);
  const afterCore = computeCore(afterInput, opts);
  const before = summarise(beforeCore);
  const after = summarise(afterCore);
  return {
    localityId: idOf(input.locality),
    computedAt: new Date(nowMs).toISOString(),
    configVersion: config.version,
    label: 'Modelled',
    persisted: false,
    changes: structuredClone(changes),
    before,
    after,
    delta: compare(before, after),
    review: afterCore.review,
    note: 'Hypothetical estimate. Nothing was saved and no real resource or record changed.',
  };
}
