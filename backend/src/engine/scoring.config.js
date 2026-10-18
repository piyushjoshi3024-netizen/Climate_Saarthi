// Response Intelligence Engine — single source of scoring configuration.
//
// Everything here is an ASSUMPTION for decision support, not a validated standard.
// Values marked "spec" come from the project specification; values marked "assumption"
// are illustrative defaults chosen by the team and must be replaced with curated
// standards before any real deployment. /methodology renders this config.
import { z } from 'zod';
import { deepFreeze } from './util.js';

export const ENGINE_VERSION = '1.0.0';
export const SERVICES = Object.freeze(['water', 'cooling', 'health', 'outreach']);

export const DEFAULT_CONFIG = deepFreeze({
  version: 'heat-1.0.0',
  hazardType: 'HEATWAVE',

  // spec: normalisations from the backend model
  normalisation: {
    severity: { LOW: 0.25, MODERATE: 0.5, HIGH: 0.75, EXTREME: 1.0 },
    warningLevel: { ADVISORY: 0.25, WATCH: 0.5, WARNING: 0.75, SEVERE: 1.0 },
    trend: { FALLING: 0.7, STABLE: 1.0, RISING: 1.15 },
  },

  // assumption: hazard intensity = weighted mean of severity and warning level
  hazard: { weights: { severity: 0.5, warningLevel: 0.5 } },

  // assumption: signal recency decay
  recency: {
    freshHours: 6, // full weight for this long after issue
    activeHalfLifeHours: 24, // then halves every 24 h while still valid…
    activeFloor: 0.6, // …but never below 0.6 while the warning is valid
    expiredResidual: 0.4, // after expiry: residual heat context only, no active warning
    expiredHalfLifeHours: 6,
    expiredCutoffHours: 48, // ignored entirely after this
  },

  vulnerability: { defaultValue: 0.5 }, // assumption, used only when data is missing (flagged)
  exposure: { densityReferencePerSqKm: 30000, defaultValue: 0.5 }, // assumption

  // assumption: risk score (no resources) used for the risk-vs-coverage matrix
  risk: { weights: { hazard: 0.6, vulnerability: 0.2, exposure: 0.2 } },

  coverage: {
    // assumption: illustrative service standards (units must match resource units exactly)
    services: {
      water: {
        label: 'Drinking water',
        unit: 'L/day',
        basis: 'population',
        ratePerPerson: 1, // 1 L/person/day supplementary public drinking water
        weight: 0.4,
        resourceTypes: ['WATER_POINT', 'WATER_TANKER'],
      },
      cooling: {
        label: 'Cooling space',
        unit: 'persons/day',
        basis: 'vulnerablePopulation',
        ratePerPerson: 0.1, // space for 10% of vulnerable residents per day
        weight: 0.3,
        resourceTypes: ['COOLING_CENTRE', 'SHADED_AREA'],
      },
      health: {
        label: 'Heat-health access',
        unit: 'consults/day',
        basis: 'vulnerablePopulation',
        ratePerPerson: 0.005, // 1 consult slot per 200 vulnerable residents per day
        weight: 0.15,
        resourceTypes: ['HEALTH_FACILITY'],
      },
      outreach: {
        label: 'Volunteer check-ins',
        unit: 'check-ins/day',
        basis: 'vulnerablePopulation',
        ratePerPerson: 0.2, // 1 in 5 vulnerable residents checked on per day
        weight: 0.15,
        resourceTypes: ['VOLUNTEER_TEAM'],
      },
    },
    availability: { AVAILABLE: 1, LIMITED: 0.5, UNAVAILABLE: 0 },
    status: { OPERATIONAL: 1, DEGRADED: 0.5, NON_OPERATIONAL: 0, CLOSED: 0 },
    staleAfterDays: 14,
    staleFactor: 0.25, // stale listings count for a quarter of their capacity
    unverifiedFactor: 1, // pending listings count fully but raise an UNVERIFIED gap
  },

  gaps: {
    insufficientBelowPct: 80,
    severeBelowPct: 40,
    inaccessibleBelow: 0.5,
    supportRadiusMeters: 750,
    criticalSupport: {
      HOSPITAL: ['water', 'cooling'],
      HEALTH_CENTRE: ['water', 'cooling'],
      SCHOOL: ['water', 'cooling'],
      ELDER_CARE: ['water', 'cooling', 'outreach'],
      WORKSITE: ['water', 'cooling'],
      DEFAULT: ['water'],
    },
    activeReportStatuses: ['OPEN', 'UNDER_REVIEW'],
  },

  priority: {
    // assumption: weights over normalised factors (0..1), summing to 1
    weights: { hazard: 0.35, deficit: 0.35, vulnerability: 0.15, exposure: 0.15 },
    modifiers: {
      unsupportedCriticalSite: { pointsEach: 4, max: 8 },
      unresolvedReport: { pointsEach: 1.5, max: 6 },
    },
    // spec: one canonical band map (score is upper-inclusive)
    bands: [
      { band: 'LOW', max: 25 },
      { band: 'MODERATE', max: 50 },
      { band: 'HIGH', max: 75 },
      { band: 'CRITICAL', max: 100 },
    ],
  },

  interventions: {
    // assumption: what a newly deployed resource is modelled to deliver
    newResource: { reliability: 0.9, accessibility: 0.9 },
    // assumption: size of a support point placed next to an unsupported critical site
    siteSupportCapacity: { water: 2000, cooling: 100, health: 10, outreach: 50 },
    // assumption: accessibility after an access improvement (ramp, signage, shade on route)
    improvedAccessibility: 0.8,
  },
});

// ---------------------------------------------------------------- validation

const nonNeg = z.number().min(0);
const unit = z.number().min(0).max(1);
const weightMap = (keys) => z.object(Object.fromEntries(keys.map((k) => [k, nonNeg]))).strict();
const enumMap = z.record(z.string().min(1), nonNeg);

const ServiceSchema = z
  .object({
    label: z.string().min(1),
    unit: z.string().min(1),
    basis: z.enum(['population', 'vulnerablePopulation']),
    ratePerPerson: z.number().positive(),
    weight: nonNeg,
    resourceTypes: z.array(z.string().min(1)).min(1),
  })
  .strict();

const ConfigSchema = z
  .object({
    version: z.string().min(1),
    hazardType: z.literal('HEATWAVE'),
    normalisation: z.object({ severity: enumMap, warningLevel: enumMap, trend: enumMap }).strict(),
    hazard: z.object({ weights: weightMap(['severity', 'warningLevel']) }).strict(),
    recency: z
      .object({
        freshHours: nonNeg,
        activeHalfLifeHours: z.number().positive(),
        activeFloor: unit,
        expiredResidual: unit,
        expiredHalfLifeHours: z.number().positive(),
        expiredCutoffHours: nonNeg,
      })
      .strict(),
    vulnerability: z.object({ defaultValue: unit }).strict(),
    exposure: z.object({ densityReferencePerSqKm: z.number().positive(), defaultValue: unit }).strict(),
    risk: z.object({ weights: weightMap(['hazard', 'vulnerability', 'exposure']) }).strict(),
    coverage: z
      .object({
        services: z.object(Object.fromEntries(SERVICES.map((s) => [s, ServiceSchema]))).strict(),
        availability: enumMap,
        status: enumMap,
        staleAfterDays: z.number().positive(),
        staleFactor: unit,
        unverifiedFactor: unit,
      })
      .strict(),
    gaps: z
      .object({
        insufficientBelowPct: z.number().min(0).max(100),
        severeBelowPct: z.number().min(0).max(100),
        inaccessibleBelow: unit,
        supportRadiusMeters: z.number().positive(),
        criticalSupport: z.record(z.string(), z.array(z.enum(SERVICES))),
        activeReportStatuses: z.array(z.string().min(1)),
      })
      .strict(),
    priority: z
      .object({
        weights: weightMap(['hazard', 'deficit', 'vulnerability', 'exposure']),
        modifiers: z
          .object({
            unsupportedCriticalSite: z.object({ pointsEach: nonNeg, max: nonNeg }).strict(),
            unresolvedReport: z.object({ pointsEach: nonNeg, max: nonNeg }).strict(),
          })
          .strict(),
        bands: z.array(z.object({ band: z.string().min(1), max: z.number().min(0).max(100) }).strict()).min(2),
      })
      .strict(),
    interventions: z
      .object({
        newResource: z.object({ reliability: z.number().gt(0).max(1), accessibility: z.number().gt(0).max(1) }).strict(),
        siteSupportCapacity: z.object(Object.fromEntries(SERVICES.map((s) => [s, z.number().positive()]))).strict(),
        improvedAccessibility: unit,
      })
      .strict(),
  })
  .strict();

export class ConfigError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = 'ConfigError';
    this.code = 'INVALID_ENGINE_CONFIG';
    this.issues = issues;
  }
}

function normaliseWeights(weights, path, warnings) {
  const entries = Object.entries(weights);
  const sum = entries.reduce((s, [, v]) => s + v, 0);
  if (!(sum > 0)) throw new ConfigError(`Weights at ${path} must sum to more than 0`, [{ path, message: 'sum is 0' }]);
  if (Math.abs(sum - 1) > 1e-9) warnings.push(`Weights at ${path} summed to ${sum}; normalised to 1.`);
  return Object.fromEntries(entries.map(([k, v]) => [k, v / sum]));
}

/**
 * Validate a config and return a normalised, frozen copy.
 * Throws ConfigError on invalid shape, negative weights, missing enums or broken bands.
 * Weight groups that don't sum to 1 are normalised (reported in `warnings`).
 */
export function validateConfig(input = DEFAULT_CONFIG) {
  const parsed = ConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new ConfigError(`Invalid engine config: ${issues.map((i) => `${i.path} ${i.message}`).join('; ')}`, issues);
  }
  const cfg = structuredClone(parsed.data);
  const warnings = [];

  // Required enum keys must be present so no record silently maps to 0.
  const required = {
    'normalisation.severity': ['LOW', 'MODERATE', 'HIGH', 'EXTREME'],
    'normalisation.warningLevel': ['ADVISORY', 'WATCH', 'WARNING', 'SEVERE'],
    'normalisation.trend': ['FALLING', 'STABLE', 'RISING'],
  };
  for (const [path, keys] of Object.entries(required)) {
    const obj = path.split('.').reduce((o, k) => o[k], cfg);
    const missing = keys.filter((k) => !(k in obj));
    if (missing.length) throw new ConfigError(`${path} is missing ${missing.join(', ')}`);
  }

  cfg.hazard.weights = normaliseWeights(cfg.hazard.weights, 'hazard.weights', warnings);
  cfg.risk.weights = normaliseWeights(cfg.risk.weights, 'risk.weights', warnings);
  cfg.priority.weights = normaliseWeights(cfg.priority.weights, 'priority.weights', warnings);

  const svcWeights = normaliseWeights(
    Object.fromEntries(SERVICES.map((s) => [s, cfg.coverage.services[s].weight])),
    'coverage.services.*.weight',
    warnings
  );
  for (const s of SERVICES) cfg.coverage.services[s].weight = svcWeights[s];

  // Each resource type may belong to exactly one service.
  const seen = new Map();
  for (const s of SERVICES) {
    for (const t of cfg.coverage.services[s].resourceTypes) {
      if (seen.has(t)) throw new ConfigError(`Resource type ${t} is mapped to both ${seen.get(t)} and ${s}`);
      seen.set(t, s);
    }
  }

  // Bands: strictly ascending, unique names, ending at 100.
  const bands = cfg.priority.bands;
  const names = new Set();
  bands.forEach((b, i) => {
    if (names.has(b.band)) throw new ConfigError(`Duplicate priority band ${b.band}`);
    names.add(b.band);
    if (i > 0 && !(b.max > bands[i - 1].max)) throw new ConfigError('Priority bands must have strictly ascending max values');
  });
  if (bands[bands.length - 1].max !== 100) throw new ConfigError('The last priority band must end at 100');

  if (cfg.gaps.severeBelowPct > cfg.gaps.insufficientBelowPct) {
    throw new ConfigError('gaps.severeBelowPct must not exceed gaps.insufficientBelowPct');
  }

  return { config: deepFreeze(cfg), warnings };
}

// Validated once at module load; a broken default config fails fast.
export const ACTIVE_DEFAULT = validateConfig(DEFAULT_CONFIG).config;

/** Accept an already-validated config or validate a raw one. */
const validated = new WeakSet([ACTIVE_DEFAULT]);
const cache = new WeakMap([[DEFAULT_CONFIG, ACTIVE_DEFAULT]]);
export function resolveConfig(config) {
  if (!config) return ACTIVE_DEFAULT;
  if (validated.has(config)) return config;
  if (cache.has(config)) return cache.get(config);
  const { config: cfg } = validateConfig(config);
  validated.add(cfg);
  cache.set(config, cfg);
  return cfg;
}

/** Map a score (0..100) to its band using the config's upper-inclusive band list. */
export function bandFor(score, config = ACTIVE_DEFAULT) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return null;
  return config.priority.bands.find((b) => score <= b.max)?.band ?? config.priority.bands.at(-1).band;
}

/** Resource type -> service key, or null if the type is not mapped. */
export function serviceForType(type, config = ACTIVE_DEFAULT) {
  for (const s of SERVICES) if (config.coverage.services[s].resourceTypes.includes(type)) return s;
  return null;
}
