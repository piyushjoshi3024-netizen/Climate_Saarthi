# Climate Saarthi — Project Brief

> Alerts tell you where it is hot. Saarthi shows where help is missing.

## What it is
An India-only **Response Intelligence Platform** for heatwaves. It finds the gap between an official heat
warning and the support actually available in each locality (water, shade, cooling, health access), explains
the resulting priority, recommends an action, and supports human approval, assignment, evidence-based
verification and recalculation.

It is **not** a weather app, a climate news site, a forecast, a diagnosis tool or an emergency service.

## Core loop (preserve exactly)
Official Signal → Risk → Local Context → Resources/Response → Coverage → Response Gap → Priority →
Intervention Recommendation → Approval → Assignment → Response Execution → Evidence Verification →
Recalculation → New Snapshot

**The innovation:** two localities under the same warning can have different priorities because their
response resources, reliability, accessibility and coverage differ.

## Scope
- **Live hazard (MVP):** heatwave only, one configurable pilot city, six fictional/demo localities.
- **Website shows exactly four climate aspects, in this order:**
  1. Heatwaves / urban heat — Heat Exposure Planner *(MVP hazard)*
  2. Floods — FloodReady India · Flood Impact Reporter *(proposed concept)*
  3. Air pollution — CleanAir Connect · Pollution Exposure Comparator *(proposed concept)*
  4. Drought and water stress — JalSanjivani · Water Stress Timeline *(proposed concept)*
- The other 14 aspects in `docs/DATASETS_AND_API.md` are reference material only and never appear in the UI.
- `/impact` reports the platform's own measured / demo / modelled outcomes only. No environmental-benefit claims.

## Non-negotiables
- JavaScript only (`.js` / `.jsx`). No TypeScript.
- MERN: React + Vite, Express, MongoDB + Mongoose. Browser never talks to MongoDB. API prefix `/api/v1`.
- Modular monolith: routes → controllers → services → pure engine / repositories.
- Every figure carries a provenance label: **Official**, **Curated**, **Demo**, **Modelled**.
- No invented live APIs or scraping presented as live data.
- Scores are decision support, not validated forecasts. "Why this score" is always visible.
- Human in the loop: no auto-dispatch; verification needs evidence.
- Privacy: no home addresses, medical or identity details; reporter contact visible only to authorised staff.
- Emergency disclaimer on report pages and footer:
  *"In an emergency call 112 (ambulance 108). Climate Saarthi is not an emergency service."*
- Visual references (Kage / ThreeUI, Leonardo.ai, Animmaster) inform direction only; no copied code, art or copy.

## Phases
| Phase | Scope | Status |
|---|---|---|
| 0 | Inspect | Done (greenfield, nothing to preserve) |
| 1 | Foundation: tokens, fonts, route shells, layout, labels, states, i18n scaffold, env, health API | **Done** |
| 2 | Pure engine + tests | **Done** (`docs/ENGINE.md`, `docs/ENGINE_WORKED_EXAMPLE.md`) |
| 3 | Mongoose models, API, seed, snapshots | **Partly done**: database connection + User, Session, AuditLog models. Localities, signals, resources, reports, seed and snapshots still to do |
| 4 | Auth, RBAC, admin queue, verification | **Partly done** (pulled forward on request): register/login/refresh/logout, RBAC, staff console entry, audit log. Queue state machine UI and verification still to do |
| 5 | Dashboard, locality, report/track, methodology | Not started |
| 6 | Map, resources, impact, solutions polish, admin tables | Not started |
| 7 | Motion kit | Not started |
| 8 | Home 3D story | Not started |
| 9 | Stretch: simulator, weights, Swiper, a11y/perf audit | Not started |
| 10 | Demo readiness | Not started |

Each phase stops for approval before the next one starts.

## Source specifications
- `docs/MASTER_PROMPT.md` — product, architecture, UI, motion, auth, phases
- `docs/DATASETS_AND_API.md` — datasets, provenance, data models, API contracts
