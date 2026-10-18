// Gap engine: turns coverage, resources, critical sites and reports into typed,
// plain-language response gaps.
import { resolveConfig, SERVICES } from './scoring.config.js';
import { requireNow, toMs, idOf, haversineMeters, SEVERITY_RANK, cmpStr, formatNumber } from './util.js';

export const GAP_TYPES = Object.freeze([
  'MISSING_RESOURCE',
  'INSUFFICIENT_CAPACITY',
  'UNAVAILABLE_RESOURCE',
  'STALE_RESOURCE',
  'UNVERIFIED_RESOURCE',
  'INACCESSIBLE_RESOURCE',
  'UNRESOLVED_REPORT',
  'UNSUPPORTED_CRITICAL_SITE',
]);

const TYPE_ORDER = Object.fromEntries(GAP_TYPES.map((t, i) => [t, i]));
const resourceLabel = (r) => r.name || `${r.type.toLowerCase().replace(/_/g, ' ')} ${r.id ?? ''}`.trim();

function serviceGaps(coverage, config) {
  const gaps = [];
  for (const s of SERVICES) {
    const c = coverage.byService[s];
    if (c.coveragePct === null) continue;
    if (c.listed === 0 && c.required > 0) {
      gaps.push({
        code: 'MISSING_RESOURCE',
        severity: 'HIGH',
        service: s,
        message: `No ${c.label.toLowerCase()} resource is listed for this locality. Modelled need is ${formatNumber(c.required)} ${c.unit}.`,
        detail: { required: c.required, unit: c.unit },
      });
    } else if (c.coveragePct < config.gaps.insufficientBelowPct) {
      const severity = c.coveragePct < config.gaps.severeBelowPct ? 'HIGH' : 'MEDIUM';
      const none = c.usable === 0;
      gaps.push({
        code: 'INSUFFICIENT_CAPACITY',
        severity,
        service: s,
        message: none
          ? `${c.label}: ${c.listed} listed resource(s) provide no usable capacity right now.`
          : `${c.label} covers ${c.coveragePct}% of modelled need (${formatNumber(c.effective)} of ${formatNumber(c.required)} ${c.unit}). Shortfall: ${formatNumber(c.shortfall)} ${c.unit}.`,
        detail: { coveragePct: c.coveragePct, effective: c.effective, required: c.required, shortfall: c.shortfall, unit: c.unit },
      });
    }
  }
  return gaps;
}

function resourceGaps(resources, config) {
  const gaps = [];
  for (const r of resources) {
    const base = { service: r.service, resourceId: r.id };
    if (r.availability === 'UNAVAILABLE' || r.factors.status === 0) {
      gaps.push({
        ...base,
        code: 'UNAVAILABLE_RESOURCE',
        severity: 'MEDIUM',
        message: `${resourceLabel(r)} is listed but ${r.availability === 'UNAVAILABLE' ? 'unavailable' : r.status.toLowerCase().replace(/_/g, ' ')}, so it adds no capacity.`,
        detail: { availability: r.availability, status: r.status },
      });
    }
    if (r.stale) {
      gaps.push({
        ...base,
        code: 'STALE_RESOURCE',
        severity: 'MEDIUM',
        message: `${resourceLabel(r)} has not been verified ${r.daysSinceVerified === null ? 'recently' : `for ${Math.floor(r.daysSinceVerified)} days`}; it counts for only ${Math.round(config.coverage.staleFactor * 100)}% of its capacity until re-verified.`,
        detail: { daysSinceVerified: r.daysSinceVerified, lastVerifiedAt: r.lastVerifiedAt },
      });
    } else if (!r.verified) {
      gaps.push({
        ...base,
        code: 'UNVERIFIED_RESOURCE',
        severity: 'LOW',
        message: `${resourceLabel(r)} has not been verified yet (status: ${r.verificationStatus.toLowerCase()}).`,
        detail: { verificationStatus: r.verificationStatus },
      });
    }
    if (r.accessibility < config.gaps.inaccessibleBelow) {
      gaps.push({
        ...base,
        code: 'INACCESSIBLE_RESOURCE',
        severity: 'MEDIUM',
        message: `${resourceLabel(r)} is hard to reach (accessibility ${r.accessibility}), which cuts its usable capacity.`,
        detail: { accessibility: r.accessibility },
      });
    }
  }
  return gaps;
}

function reportGaps(reports, nowMs, config) {
  const active = new Set(config.gaps.activeReportStatuses);
  const open = reports.filter((rep) => {
    const status = String(rep?.status ?? '').toUpperCase();
    const exp = toMs(rep?.expiresAt);
    return active.has(status) && (exp === null || exp > nowMs);
  });
  const byType = new Map();
  for (const rep of open) {
    const t = String(rep.type ?? 'OTHER').toUpperCase();
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(idOf(rep));
  }
  return [...byType.entries()]
    .sort(([a], [b]) => cmpStr(a, b))
    .map(([type, ids]) => ({
      code: 'UNRESOLVED_REPORT',
      severity: ids.length >= 3 ? 'HIGH' : 'MEDIUM',
      reportType: type,
      reportIds: ids.sort(cmpStr),
      count: ids.length,
      message: `${ids.length} unresolved ground report(s) about ${type.toLowerCase().replace(/_/g, ' ')}.`,
      detail: { count: ids.length },
    }));
}

function siteGaps(criticalSites, coverage, resources, config) {
  const gaps = [];
  const radius = config.gaps.supportRadiusMeters;
  for (const site of criticalSites) {
    const siteType = String(site?.type ?? 'DEFAULT').toUpperCase();
    const needs = site?.requiredSupport ?? config.gaps.criticalSupport[siteType] ?? config.gaps.criticalSupport.DEFAULT;
    const missing = [];
    const checks = [];
    for (const s of needs) {
      const candidates = resources.filter((r) => r.service === s && r.usable && !r.stale);
      const withDistance = candidates
        .map((r) => ({ r, d: haversineMeters(site.location, r.location) }))
        .filter((x) => x.d !== null);
      if (site.location && withDistance.length > 0) {
        const nearest = withDistance.sort((a, b) => a.d - b.d)[0];
        const ok = nearest.d <= radius;
        checks.push({ service: s, method: 'distance', nearestMeters: Math.round(nearest.d), supported: ok });
        if (!ok) missing.push(s);
      } else if (site.location && candidates.length === 0) {
        checks.push({ service: s, method: 'distance', nearestMeters: null, supported: false });
        missing.push(s);
      } else {
        const pct = coverage.byService[s]?.coveragePct;
        const ok = pct !== null && pct !== undefined && pct >= config.gaps.insufficientBelowPct;
        checks.push({ service: s, method: 'locality coverage (no coordinates)', coveragePct: pct ?? null, supported: ok });
        if (!ok) missing.push(s);
      }
    }
    if (missing.length) {
      const name = site.name || siteType.toLowerCase();
      const labels = missing.map((s) => config.coverage.services[s].label.toLowerCase());
      gaps.push({
        code: 'UNSUPPORTED_CRITICAL_SITE',
        severity: 'HIGH',
        siteId: idOf(site),
        siteType,
        missingServices: missing,
        message: `${name} has no usable ${labels.join(' or ')} support within ${radius} m.`,
        detail: { checks, radiusMeters: radius },
      });
    }
  }
  return gaps;
}

/**
 * computeGaps({ coverage, criticalSites, reports }, { now, config })
 * `coverage` is the output of computeCoverage.
 */
export function computeGaps({ coverage, criticalSites = [], reports = [] } = {}, { now, config: rawConfig } = {}) {
  const nowMs = requireNow(now);
  const config = resolveConfig(rawConfig);
  const gaps = [
    ...serviceGaps(coverage, config),
    ...resourceGaps(coverage.resources, config),
    ...reportGaps(reports, nowMs, config),
    ...siteGaps(criticalSites, coverage, coverage.resources, config),
  ];
  gaps.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      TYPE_ORDER[a.code] - TYPE_ORDER[b.code] ||
      cmpStr(a.service, b.service) ||
      cmpStr(a.resourceId ?? a.siteId ?? a.reportType, b.resourceId ?? b.siteId ?? b.reportType)
  );
  return gaps.map((g, i) => ({ key: `${g.code}:${g.service ?? ''}:${g.resourceId ?? g.siteId ?? g.reportType ?? ''}`, rank: i + 1, ...g }));
}

/** Count helpers used by the priority modifiers. */
export const countUnsupportedSites = (gaps) => gaps.filter((g) => g.code === 'UNSUPPORTED_CRITICAL_SITE').length;
export const countUnresolvedReports = (gaps) =>
  gaps.filter((g) => g.code === 'UNRESOLVED_REPORT').reduce((n, g) => n + g.count, 0);
