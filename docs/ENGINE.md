# Response Intelligence Engine

Pure JavaScript in `backend/src/engine/`. No Express, database, network, randomness or wall-clock reads:
every function takes an explicit `now`, so the same input always gives the same output. Everything it
returns is **Modelled** and carries the engine version (`1.0.0`) and config version (`heat-1.0.0`).

It is decision support for heatwave triage. It does not forecast weather, predict health outcomes or
measure harm. All service standards and weights are **assumptions** in `scoring.config.js` and must be
replaced with curated standards before real use.

## Pipeline
```
signals ─► risk ──────────────┐
locality ─┘                   ├─► priority ─► explanation, snapshot
resources ─► coverage ─► gaps ┘        └──► interventions (each estimated by a copy-only what-if)
critical sites, reports ─────► gaps
```

| Module | Does |
|---|---|
| `scoring.config.js` | The single config, `validateConfig`, `bandFor`, version constants |
| `risk.engine.js` | Picks the driving signal; hazard, vulnerability, exposure, risk score |
| `coverage.engine.js` | Effective capacity per resource; coverage and deficit per service and overall |
| `gap.engine.js` | The eight typed gaps with plain-language messages |
| `priority.engine.js` | Weighted factors + modifiers → score and band |
| `intervention.engine.js` | Gaps → ranked recommendations with modelled effect |
| `whatif.engine.js` | Applies hypothetical resource changes to a deep copy; before/after |
| `explanation.engine.js` | "Why this score": summary, reasons, formulas, assumptions, limitations |
| `state.machine.js` | Intervention lifecycle and verification guards |
| `snapshot.js` | Priority snapshot shape for persistence (Phase 3) |
| `index.js` | `analyzeLocality(input, { now, config })` and re-exports |

## Formulas

**Signal selection.** Heatwave signals only. The latest *active* signal (issued ≤ now ≤ validUntil) wins;
if none is active, the latest recently-expired one gives residual context. Invalid signals go to `review`.

**Hazard**
```
intensity = w_sev × severity + w_warn × warningLevel      (w = 0.5 / 0.5)
            expired signal → warning term is 0 (not an active warning)
recency   = active:  1 for 6 h, then 0.5^((age − 6) / 24), floor 0.6
            expired: 0.4 × 0.5^(hoursSinceExpiry / 6), 0 after 48 h
hazard    = intensity × recency × trend                    (trend FALLING 0.7 · STABLE 1 · RISING 1.15)
```
Normalisations (spec): severity LOW 0.25 · MODERATE 0.5 · HIGH 0.75 · EXTREME 1;
warning ADVISORY 0.25 · WATCH 0.5 · WARNING 0.75 · SEVERE 1. If a signal has no trend, it is derived by
comparing with the previous signal's intensity.

**Vulnerability** = vulnerablePopulation ÷ population. **Exposure** = the locality's `exposureIndex`, else
population density ÷ 30,000/km². Missing data uses 0.5 and is flagged as assumed.

**Risk score** (resources not included; used for the risk-vs-coverage matrix)
```
risk = 100 × clamp01(0.6 × min(1, hazard) + 0.2 × vulnerability + 0.2 × exposure)
```

**Coverage**
```
availabilityFactor = availability (1 / 0.5 / 0) × status (1 / 0.5 / 0) × freshness
freshness          = verified 1 · pending 1 (but flagged) · stale 0.25 (STALE or > 14 days since verification)
effectiveCapacity  = capacity × reliability × accessibility × availabilityFactor
coverage %         = min(1, Σ effective ÷ required) × 100        deficit % = 100 − coverage %
overall coverage % = Σ serviceWeight × service coverage %
```

| Service | Resource types | Unit | Demand (assumption) | Weight |
|---|---|---|---|---|
| Drinking water | WATER_POINT, WATER_TANKER | L/day | 1 per resident | 0.40 |
| Cooling space | COOLING_CENTRE, SHADED_AREA | persons/day | 0.1 per vulnerable resident | 0.30 |
| Heat-health access | HEALTH_FACILITY | consults/day | 0.005 per vulnerable resident | 0.15 |
| Volunteer check-ins | VOLUNTEER_TEAM | check-ins/day | 0.2 per vulnerable resident | 0.15 |

A resource's unit must match its service's unit exactly; otherwise it goes to `review`.

**Priority**
```
base     = 100 × (0.35 × hazard + 0.35 × deficit + 0.15 × vulnerability + 0.15 × exposure)
modifier = +4 per unsupported critical site (max +8) + 1.5 per unresolved report (max +6)
score    = clamp(0, 100, base + modifiers), rounded to 0.1
```
Because a RISING trend can lift hazard above 1, the score may reach the 100 cap; `capped: true` is reported.

**Bands** (single canonical map, upper-inclusive): LOW ≤ 25 · MODERATE ≤ 50 · HIGH ≤ 75 · CRITICAL ≤ 100.
The frontend never maps scores to bands itself.

## Gaps
| Code | When | Severity |
|---|---|---|
| MISSING_RESOURCE | No listing for a service with demand | HIGH |
| INSUFFICIENT_CAPACITY | Coverage < 80% (HIGH if < 40%) | HIGH / MEDIUM |
| UNAVAILABLE_RESOURCE | Unavailable, non-operational or closed | MEDIUM |
| STALE_RESOURCE | STALE, or verified more than 14 days ago | MEDIUM |
| UNVERIFIED_RESOURCE | Not yet verified | LOW |
| INACCESSIBLE_RESOURCE | Accessibility < 0.5 | MEDIUM |
| UNRESOLVED_REPORT | OPEN / UNDER_REVIEW and not expired (grouped by type) | MEDIUM, HIGH if ≥ 3 |
| UNSUPPORTED_CRITICAL_SITE | No usable, non-stale support for a required service within 750 m (falls back to locality coverage when coordinates are missing) | HIGH |

## Interventions
Each gap maps to an action: deploy a water tanker, open a cooling centre, coordinate health capacity,
organise volunteer check-ins, re-verify / verify / restore a resource, improve access, review reports,
or support a critical site. Capacity actions are sized to close the shortfall at the modelled
reliability and accessibility of a new resource (0.9 × 0.9). Each action's effect is estimated by
running the engine on a copy with that change alone; actions are ranked by modelled priority reduction.
Every item has `status: RECOMMENDED` and `requiresApproval: true`.

## What-if
`runWhatIf(input, changes, { now })` accepts `add`, `update` (allowed fields only) and `remove` on resources,
works on a deep copy, and returns `before`, `after`, `delta`, `label: 'Modelled'`, `persisted: false`.

## Lifecycle
```
RECOMMENDED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED → VERIFICATION_PENDING → VERIFIED → CLOSED
                   └────────┴──────────┴─► REJECTED / EXPIRED (reason required)
VERIFICATION_PENDING → IN_PROGRESS only with a FAILED verification result
```
Verifying needs evidence, a SUCCESS or PARTIAL result, and a verifier who did not complete the work.
Illegal moves throw `TransitionError` (`status: 409`). Community confirmations never verify on their own.

## Review queue
Records the engine cannot map are returned in `review`, never guessed: unknown resource types, unit
mismatches, out-of-range reliability/accessibility, unknown availability/status, signals with unknown
enums or bad timestamps, and localities without population data (scored as `NEEDS_REVIEW`).

## Commands
```bash
cd backend
npm test                 # all engine tests
npm run engine:example   # regenerates docs/ENGINE_WORKED_EXAMPLE.md
```
