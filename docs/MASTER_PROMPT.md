Climate Saarthi — Full-Stack Master Prompt (MERN + JavaScript)
Use this as the main prompt in Claude Pro / Google AI Studio / Antigravity. It combines the frontend creative direction, backend requirements, dataset/API rules and phased delivery in one compact specification. Existing repository wins: inspect before changing files.

ROLE AND TASK
Act as my senior full-stack engineer, climate-response systems designer, creative frontend lead, security reviewer and hackathon delivery partner. Build Climate Saarthi, an India-only Response Intelligence Platform using a MERN modular monolith. Preserve the core idea and do not turn it into generic CRUD, a weather app or a climate news site.
Pitch: “Alerts tell you where it is hot. Saarthi tells you where help is missing.” The platform identifies gaps between official climate risk and actual support, explains priority, recommends an action, supports human assignment and verification, and recalculates the response gap after evidence-based verification.
MVP hazard: heatwave only. The architecture may support plug-in hazard modules later, but do not build other hazard engines now. Show exactly four climate aspects in the public climate-solutions/impact showcase, matching the supplied reference image: (1) Heatwaves / urban heat — Heat Exposure Planner; (2) Floods — FloodReady India / Flood Impact Reporter; (3) Air pollution — CleanAir Connect / Pollution Exposure Comparator; (4) Drought and water stress — JalSanjivani / Water Stress Timeline. Label the latter three as informational/proposed solutions, not implemented/live hazard engines. Do not show the other 14 aspects in the website showcase.
Pilot: one configurable Indian city with six fictional/demo localities until reliable source data is curated. Time budget: 6 hours. Build the smallest end-to-end working loop first.
PHASE 0 — INSPECT FIRST
Inspect the current repository and report framework, package manager, routes, key components, styling, animation setup, server structure, database setup, run/test/build commands and risky files. Do not modify anything in this phase. Then propose the smallest Phase 1 plan with files and packages to change. Preserve useful existing work; never rewrite unrelated files silently.
NON-NEGOTIABLE RULES
1. JavaScript only: React components .jsx, logic/config .js; no .ts/.tsx, interfaces, static type annotations or TypeScript build step. Configure shadcn/ui for JavaScript. Zod remains for runtime validation; JSDoc is optional.
2. MERN: React + Vite, Node.js, Express.js, MongoDB + Mongoose. Frontend talks to the Express REST API; browser never connects directly to MongoDB. Use /api/v1.
3. Modular monolith: routes → thin controllers → services → pure deterministic engine/repositories → MongoDB. No microservices, GraphQL, Kafka or unneeded infrastructure.
4. Provenance labels everywhere: Official (source + timestamp), Curated (team-verified + last checked), Demo (is_demo: true synthetic record), Modelled (engine/what-if value + assumptions/version). Demo records are excluded from real-only totals. Every modelled score links to /methodology.
5. No invented live APIs: IMD/NDMA/CPCB portals may be linked, but do not scrape or claim a live API unless exact documented access is verified. MVP official signal is entered by an authorised admin with source URL, issue time and validity, or imported from a validated CSV. Keep an OfficialSignalProvider adapter contract for later.
6. Scores are decision support, not validated forecasts: no claims of predicting deaths, saving lives, cooling degrees or reducing emissions. Show Why this score, formula, factor breakdown, weights, assumptions and limitations.
7. Human in the loop: recommendations require coordinator/admin approval; no auto-dispatch. Verification needs evidence. Community “fixed/not fixed” confirmations are supporting evidence, not official verification.
8. Privacy and security: no public home addresses or medical/identity details. Reporter contact is optional and visible only to authorised coordinators/admin. Reports expire. Hash passwords with bcrypt; use access/refresh token strategy with secure server-validated sessions; protect routes and records by role and locality; secrets stay server-side in .env.
9. Emergency disclaimer on report pages and footer: “In an emergency call 112 (ambulance 108). Climate Saarthi is not an emergency service.”
10. Motion supports the product: all content/forms/tables/metrics remain semantic and functional without animations. Reduced-motion and WebGL fallbacks must preserve meaning.
11. Licensing: use Kage / ThreeUI / Leonardo.ai / Animmaster as visual references only. Do not copy their code, art or copy unless permission/licence explicitly permits it. Original procedural 3D geometry and properly licensed assets only. Keep OpenStreetMap attribution; illustrative borders are labelled.
12. Phase discipline: before each phase, list plan/files/packages. After it, run relevant tests/build, check the console, report exact files changed, delivered behaviour and remaining gaps. Stop after the requested phase; do not jump ahead.
STACK
- Frontend: React + Vite + JavaScript, React Router, Tailwind, shadcn/ui JS config, TanStack Query/Table, React Hook Form + Zod.
- Backend: Node.js + Express + Mongoose/MongoDB.
- Security: Helmet, exact-origin CORS, express-rate-limit, bcrypt, JWT/session rotation, RBAC, Zod, centralized error middleware, Pino.
- Testing: Vitest for pure engine modules; Jest + Supertest for Express/API tests (if existing repo uses one runner consistently, retain it rather than adding duplicates). Thunder Client for manual API collection. No Swagger/OpenAPI UI.
- Visuals: Motion for React for component/UI transitions; GSAP + ScrollTrigger for scroll scenes; Lenis for smooth scroll, only if needed; Swiper for carousels; React Three Fiber + drei + three on Home only; Leaflet/OpenStreetMap; Recharts.
- Redis, BullMQ and Socket.IO are optional. Add each only if the current feature actually needs it. The core workflow must work without them.
PRODUCT WORKFLOW — PRESERVE EXACTLY
Official Signal → Risk → Local Context → Resources/Response → Coverage → Response Gap → Priority → Intervention Recommendation → Approval → Assignment → Response Execution → Evidence Verification → Recalculation → New Snapshot
The innovation is Response Gap Intelligence: two localities may have the same official warning but different priority because response resources, accessibility, reliability and coverage differ.
RESPONSE INTELLIGENCE ENGINE
Implement as pure JavaScript modules in backend/src/engine/: risk, coverage, gap, priority, intervention, what-if, explanation and scoring config. No Express/database I/O, randomness or hardcoded final scores. All results contain timestamps/version, factors, reasons and an explanation trail.
- Risk: use the latest valid signal, hazard severity, warning level, recency decay, trend, vulnerability, exposure and critical-site context. Expired signals must not be treated as active warnings. Suggested normalisations from the backend model: severity LOW 0.25, MODERATE 0.50, HIGH 0.75, EXTREME 1.00; warning ADVISORY 0.25, WATCH 0.50, WARNING 0.75, SEVERE 1.00; trend FALLING 0.7, STABLE 1.0, RISING 1.15. Make assumptions configurable.
- Coverage: effectiveCapacity = availableCapacity × reliability × accessibility × availabilityFactor. coverage = min(1, effectiveCapacity / requiredCapacity) × 100, deficit = 100 - coverage. Demand/service standards and units are configurable assumptions, clearly labelled.
- Gaps: MISSING_RESOURCE, INSUFFICIENT_CAPACITY, UNAVAILABLE_RESOURCE, STALE_RESOURCE, UNVERIFIED_RESOURCE, INACCESSIBLE_RESOURCE, UNRESOLVED_REPORT, UNSUPPORTED_CRITICAL_SITE. Return plain-language explanations.
- Priority: use risk, vulnerability, exposure, resource deficit, recency, plus documented trend, critical-site and unresolved-report modifiers. Keep the formula deterministic, weights/config validated and explanation visible. One canonical default band map: LOW 0–25, MODERATE 26–50, HIGH 51–75, CRITICAL 76–100. Avoid competing score definitions across frontend/backend; document the active formula in /methodology.
- Interventions: map gaps to ordered actions such as deploy water tanker/activate point, open cooling centre, re-verify stale resource, organise approved volunteer check-ins or coordinate with a health facility. These are recommendations only.
- What-if: accept hypothetical resource changes and return before/after coverage, deficit, priority and gap reduction. It must never mutate MongoDB.
- Verification loop: legal states RECOMMENDED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED → VERIFICATION_PENDING → VERIFIED → CLOSED, plus REJECTED and EXPIRED. On verified evidence, update the resource/response, recalculate coverage/gaps/priority, write snapshot + audit entry, invalidate relevant cache, then emit meaningful socket event/notification if those features exist.
Required tests: same signal + different resources produces different priorities; expired signals decay; stale/non-operational resources add little capacity; verified resource improves modelled coverage; rising trend affects score deterministically; weights validated/normalised; unmapped records go to review; what-if has no database side effect; illegal state transitions fail.
FOUR-ASPECT CLIMATE SOLUTIONS SHOWCASE
Build a public /solutions page or showcase section containing exactly these four cards and no additional climate-aspect cards. These are the four selected aspects from the supplied reference image. Each card contains: problem, affected people/region, practical solution, signature feature, measurable success metric, relevant Indian source/programme link, and a Proposed / Curated label. Heatwave is the only hazard connected to the live Response Intelligence Engine in the MVP. Floods, air pollution, and drought/water stress are informative solution concepts only; do not build their engines or present them as live integrations.
1. Heatwaves / urban heat — Heat Exposure Planner
   - Show official heat warnings and weather observations via verified official source links.
   - Let users select an activity or user context.
   - Present relevant precautions for the forecast/warning period from approved sources.
   - Map verified drinking-water points, shaded areas, and cooling facilities.
   - Success metric: verified resources accessed and help requests resolved.
   - Source references: IMD district-wise warnings https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php; NCDC climate and health guidance https://ncdc.mohfw.gov.in/includes/About/CentresAndDivision/CEOH.php.
2. Floods — FloodReady India; signature feature: Flood Impact Reporter
   - Show official rainfall and flood warnings with source and timestamp.
   - Accept non-emergency geotagged reports of waterlogging and blocked drains, using locality-level location and privacy controls.
   - Group likely duplicate reports and let moderators verify and update incident status.
   - Success metric: verified incidents and time to review reports.
   - Source references: CWC Flood Forecasting https://ffs.india-water.gov.in/; CWC 7-day advisory https://aff.india-water.gov.in/; NDMA https://ndma.gov.in/.
   - Informational concept only in this MVP; do not build a live flood engine or forecast.
3. Air pollution — CleanAir Connect; signature feature: Pollution Exposure Comparator
   - Show station-based AQI and pollutant readings only when the source data and timestamps are available and verified.
   - Compare monitoring stations and historical trends where data supports it.
   - Explain the applicable AQI category and source-linked precautions.
   - Accept reports of suspected open burning or excessive dust, subject to moderation.
   - Success metric: data freshness, reviewed reports, and documented follow-up.
   - Source references: CPCB National AQI https://airquality.cpcb.gov.in/AQI_India/; CAQM https://caqm.nic.in/.
   - Informational concept only in this MVP; do not claim an unverified live AQI feed.
4. Drought and water stress — JalSanjivani; signature feature: Water Stress Timeline
   - Compare rainfall and available water-resource indicators over time when trustworthy records exist.
   - Show official groundwater assessments at their actual geographic resolution, including assessment year and source.
   - Map verified rainwater-harvesting and conservation initiatives.
   - Allow community groups to document restoration work, subject to review.
   - Success metric: verified initiatives, updated resource records, and documented project progress.
   - Source references: CGWB groundwater resource assessment https://cgwb.gov.in/index.php/en/ground-water-resource-assessment-0; India-WRIS https://indiawris.gov.in/wris/.
   - Informational concept only in this MVP; do not infer household water supply from block-level statistics or build a live drought engine.
Display rules: the /solutions showcase and any home-page climate-aspect showcase must show only these four cards, in this order. The /impact page reports Climate Saarthi's own measured/demo/modelled platform metrics; do not imply that the platform has measured environmental impact across four hazards. It may filter or group records by these four aspect categories, but the active engine's verified operational metrics are heatwave-only. Do not show the other 14 climate aspects anywhere as aspect cards, tabs, extra categories, or filler content.
Official portals are references, not proof of API availability. Verify the specific dataset/resource, access method, licence and freshness before integrating it. Never invent live data or scrape a portal and label it live. If no supported data feed is verified, link to the official source and show curated/demo data with its correct label.
DATA MODEL — MONGODB / MONGOOSE
Collections: users, localities, climateSignals, resources, criticalSites, reports, interventions, responses, verifications, prioritySnapshots, notifications, engineConfigs, auditLogs.
Use Mongoose schemas, timestamps, appropriate validation and restrained indexes. Geo fields use GeoJSON Point { type: "Point", coordinates: [longitude, latitude] } with 2dsphere indexes. Use is_demo, createdAt, source/provenance and expiry fields where relevant. Index only real query paths.
Minimum idempotent demo seed: 10 users, 10 localities, 20 climate signals, 30 resources, 10 critical sites, 30 reports, 15 interventions, 10 responses, 10 verifications. Every synthetic document is is_demo: true. Include the A-vs-B same-warning/different-resources story. Include the provided Rohini scenario as synthetic demo input: population 25,000, vulnerable population 9,000, example EXTREME heat, rising trend; water requirement 25,000 L/day, available 8,000 L/day, reliability 0.75, accessibility 0.65, effective capacity 3,900 L/day and modelled coverage 15.6%. Never present it as current real data or hardcode the final score.
BACKEND API CONTRACT
Prefix /api/v1; standard JSON response:
{ "success": true, "data": {}, "message": "Success" }; errors { "success": false, "message": "...", "error": { "code": "..." } }.
Core routes:
- Auth: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me.
- Localities: POST /localities, GET /localities, GET /localities/:id, PATCH /localities/:id, GET /localities/:id/intelligence.
- Climate: POST /climate/signals, GET /climate/signals, GET /climate/signals/:id, GET /climate/risk/:localityId.
- Resources: POST /resources, GET /resources, GET /resources/:id, GET /resources/nearby, PATCH /resources/:id.
- Critical sites: create/list/update routes protected by coordinator/admin roles.
- Reports: POST /reports, GET /reports, GET /reports/:id, PATCH /reports/:id/status, plus an anonymised track-by-reference endpoint.
- Intelligence: GET /intelligence/:localityId, GET /intelligence/:localityId/risk, /coverage, /gaps, /priority, /interventions; POST /intelligence/what-if.
- Interventions: GET /interventions, POST /interventions, GET /interventions/:id, PATCH /interventions/:id.
- Responses: POST /responses, GET /responses, GET /responses/:id, PATCH /responses/:id/status, PATCH /responses/:id/assign.
- Verification: POST /verifications, GET /verifications/:id.
- Frontend support endpoints when needed: GET /health, GET /impact/summary, GET /impact/history, GET /admin/queue/summary, GET/PATCH /admin/engine-config, GET /admin/audit, validated admin CSV import. Do not build unused endpoints just for completeness.
Apply Zod validation to body/params/query. Paginate list results. Every protected route validates session, role and locality scope server-side. Public report serializers exclude private contact and internal notes. Use proper status codes; 409 for illegal state transitions. Maintain a Thunder Client collection and environment. Do not add Swagger/OpenAPI UI.
ROLES AND LOGIN UX
Roles: CITIZEN, VOLUNTEER, ORGANIZATION, RESPONDER, COORDINATOR, ADMIN.
- /login: normal users and approved staff sign in; /register: public self-registration allows only CITIZEN, VOLUNTEER or ORGANIZATION. Never accept privileged role choices from public signup.
- /admin/login: dedicated visual route for admin/coordinator but same secure backend auth. No hardcoded credentials or demo passwords. Create first admin securely via documented seed/admin script/environment bootstrap; do not ship public admin registration.
- Role-aware redirect/dashboard; /workspace for citizen/volunteer/organisation/responder; /admin/* is guarded in React and by Express middleware. UI route protection is not a security boundary.
- Include show/hide password, pending/loading, generic credential error, validation, logout, session expiry and forbidden (403) states. Add a demo sign-in only if it is an explicit local seed workflow with no hardcoded production credentials and a visible demo disclaimer.
FRONTEND INFORMATION ARCHITECTURE
Build these routes as connected, responsive React pages. If six hours forces scope cuts, keep all route shells but fully wire the MUST workflows first.
Public:
1. / Home story — one shared 3D world and four chapter beats: 00 SIGNAL, 01 GAP, 02 PRIORITY, 03 VERIFIED. Hero copy: “Alerts tell you where it is hot. Saarthi shows where help is missing.” CTAs “See priority localities” and “Report a ground issue”. Show source-labelled fact cards, core loop and a final CTA.
2. /dashboard — official/demo signal card, KPI row, ranked locality table, risk-vs-coverage matrix, distribution chart, recent activity.
3. /map — Leaflet map/list toggle, illustrative polygon note, priority/risk/coverage/resource/report/site layers, accessible legend and side panel.
4. /locality/:id — “Why this score”, factor breakdown, resource coverage/demand/capacity, gaps, critical sites, resources, reports, ranked interventions, response timeline, what-if and before/after.
5. /resources — search/filter resource directory with capacity, reliability, accessibility, source, last verification and report-outdated action.
6. /report — non-emergency report form, locality/report type/note/optional contact/consent/expiry, no medical or personal data, result/reference ID and emergency banner.
7. /track — anonymised report status and timeline by reference code.
8. /impact — measured/demo toggle, verified activities and modelled before/after; “What we do not claim”.
9. /methodology — plain-language and exact formula explanations, config assumptions, labels/sources, limits and human-in-the-loop rule.
10. /solutions — exactly the four climate-solution cards above, searchable/filterable if useful; only the heatwave module is operational, while the other three cards are informational concepts.
11. /simulator — stretch: resource-budget what-if optimiser, labelled Modelled and assumption list.
12. /learn — optional learning page or merge educational content into /solutions; no duplicate empty section.
User / responder: /login, /register, /workspace, /responses (assigned response list and status update), and /profile if needed. Respect role-based visibility and API permissions.
Admin/coordinator: /admin/login, /admin, /admin/queue, /admin/verification, /admin/signals, /admin/localities, /admin/resources, /admin/reports, /admin/weights (stretch) and /admin/audit. Coordinator sees only assigned localities; admin sees all. Verification requires evidence and shows before/after score/coverage.
Global pages: NotFound/403. Every page has loading skeleton, empty/error/retry state, labels, footer with source links and emergency disclaimer, mobile layout and English/Hindi toggle scaffolding.
VISUAL DIRECTION — CINEMATIC, FUNCTIONAL, NOT A TEMPLATE CLONE
Use design principles from Kage / ThreeUI, Leonardo.ai and Animmaster 3D, not their original code, artwork, text or branded assets.
- Mood: premium editorial climate-tech, dark forest #0B0F0D, surfaces #121814/#1A221D, warm text #F4F1EA, primary green #3DDC84, amber #FFB020; severity includes icon + label, never colour alone. Spacious sections, huge typography, subtle borders, card radius ~20px, 8px spacing scale, monospace chapter metadata.
- Liquid-glass floating pill navbar with backdrop blur, thin border and a plain-pill fallback. Compact on scroll; optionally hide on scroll-down/reappear on scroll-up without layout shift. Active indicator uses Motion layoutId. Mobile menu is a focus-trapped full-screen sheet with Escape close and scroll lock.
- Magnetic buttons: primary CTAs only, fine pointers only, max ~10px movement; disabled on touch/reduced motion.
- Tilt cards: max ~6deg perspective and subtle highlight, no hover-only content, disabled on coarse pointer/reduced motion.
- Swiper: no autoplay, useful coverflow/creative effect only where it helps, keyboard/touch/navigation controls and responsive slides.
- Headline split reveal, staggered cards, count-up KPIs, priority-bar fills, score-dial easing, subtle parallax and short route transitions. Data pages prioritise reading clarity and speed over effects.
- Preloader only while real critical assets/data load: accessible status, indeterminate line, no fake percentage/fixed wait, ~4s timeout to static fallback.
- 3D Home only: one lazy-loaded React Three Fiber <Canvas> behind the Home story; original procedural scene of two adjacent neighbourhoods, instanced geometry, dusk/heat haze, limited points and resource coverage rings. Four reversible GSAP camera beats: SIGNAL = wide amber scene; GAP = compare two localities under the same warning but different support; PRIORITY = emphasise the uncovered locality; VERIFIED = add support point, expand coverage rings and lower the modelled priority visual. HTML provides all text/controls.
- Pin only on desktop and keep pin duration limited; mobile stacks chapters. Static CSS/SVG fallback for WebGL failure, low-power devices and reduced motion. Cap DPR; pause offscreen/tab-hidden; no excessive bloom/video.
- One library per job: Motion for component UI transitions; GSAP/ScrollTrigger for scroll/camera timelines; Lenis only if needed and correctly synced. Never animate the same element's transform with both Motion and GSAP. Clean up triggers/listeners on route change/unmount.
- All original imagery/procedural geometry or licensed assets only. Keep OpenStreetMap attribution.
PROJECT STRUCTURE (ADAPT, DON'T REWRITE THE REPO)
frontend/
  src/app/                 router/providers/auth/i18n
  src/pages/               Home, Dashboard, Map, Locality, Resources, Report, Track,
                           Impact, Methodology, Solutions, Simulator, NotFound
  src/pages/admin/         Login, Overview, Queue, Verification, Signals, Localities,
                           Resources, Reports, Weights, Audit
  src/components/layout/   Navbar, MobileSheet, Footer, DemoBanner, PageTransition, Preloader
  src/components/motion/   Cursor, MagneticButton, TiltCard, SplitText, CountUp, Reveal
  src/components/scene/    ClimateWorld, cameraBeats.js, StaticFallback
  src/components/viz/      PriorityBadge, ScoreDial, FactorBreakdown, CoverageBars, Matrix, Timeline
  src/lib/                 api.js, validation.js, i18n/
  src/data/                demo data, is_demo=true
backend/
  src/config/              env.js, database.js, redis.js, logger.js
  src/modules/             auth, users, climate, localities, resources, criticalSites,
                           reports, interventions, responses, verification, notifications
  src/engine/              risk.engine.js, coverage.engine.js, gap.engine.js,
                           priority.engine.js, intervention.engine.js, whatif.engine.js,
                           explanation.engine.js, scoring.config.js, index.js
  src/middleware/          authenticate.js, authorize.js, validate.js, error.js, rateLimit.js
  src/jobs/ queues/ sockets/ routes/ utils/
  seed/ tests/ app.js server.js
README.md  PROJECT_BRIEF.md  .env.example
BUILD PHASES — DO NOT SKIP AHEAD
Phase 0 — Inspect: report stack/routes/scripts/risky files only; no edits.
Phase 1 — Foundation: adapt repo; JS Vite/React/Tailwind/shadcn, tokens/fonts, route shells, layout/footer/demo banner/page transition, DataLabel, PriorityBadge, skeleton/empty/error states, i18n scaffolding, env examples and PROJECT_BRIEF. No animation libraries yet.
Phase 2 — Engine: pure JavaScript engine functions + Vitest/Jest tests and worked factor-breakdown example; no UI.
Phase 3 — Data/API: Mongoose models/indexes, Express API validation/auth, idempotent demo seed, authoritative recalculation endpoint and snapshots. Test role rules.
Phase 4 — Auth/Admin: secure login, registration role restrictions, protected UI/API routes, overview, queue state machine, verification evidence, recalculation and audit. Test non-admin direct API access and invalid transitions.
Phase 5 — Core pages: dashboard, locality detail, report/track, methodology. Every figure labelled and every form has validation/errors.
Phase 6 — Supporting pages: map/resources/impact/solutions and admin tables/signals.
Phase 7 — Motion kit: smooth scroll provider if needed, cursor, magnetic CTA, tilt card, navbar/mobile sheet, split text, count-up/reveal/bar fills/transitions; reduced-motion/touch fallback. Document Motion-vs-GSAP ownership.
Phase 8 — Home 3D: four camera beats, mobile/static fallbacks, genuine-loading preloader, lazy import; test forward/reverse scroll, resize, route change, WebGL-off and reduced motion.
Phase 9 — Stretch polish: simulator/greedy allocation, weights preview, Swiper; audit accessibility/performance and fix top issues.
Phase 10 — Demo readiness: resettable seed, README, Thunder Client collection, 2–3 minute demo runbook and backup screenshots/video instructions.
DATASETS AND ENDPOINT DOCS
Create and maintain README.md documenting source registry, labels, record contracts, API catalogue, request/response examples, roles, environment variables, setup/test/seed commands, Thunder Client collection and known API limitations. Use the companion dataset/API README as the initial template if supplied. Cite official URLs inline. data.gov.in needs checking at the individual resource level; API key generation is available to registered users, but API availability varies by resource. Never hardcode keys or imply every portal has a usable REST API.
ACCEPTANCE CRITERIA
1. Full vertical slice: official/demo signal → risk/coverage/gap/priority → explanation/intervention → coordinator approve/assign → responder completes → verifier records evidence → coverage/priority recompute → snapshot/impact updates.
2. The A-vs-B scenario is reproducible: same heat warning, different response capacity, different explainable priority.
3. No hardcoded final intelligence score, fake live feed, false impact metric or unverified delivery claim.
4. Admin routes fail closed in UI and API. Public responses never contain private contact or internal notes.
5. What-if never mutates persistent data. State transitions are enforced server-side.
6. Run engine tests, API integration tests, then build. Check console and error logs. Test 360px mobile, keyboard navigation, reduced motion and WebGL fallback.
7. Aim Lighthouse mobile >=80 on Home if time allows; no layout shift, duplicate ScrollTriggers/listeners or secrets in client bundle.
8. Every phase output: (a) brief plan/files/packages, (b) complete code with paths, (c) commands/results, (d) files changed/tests run/known limitations.
DEMO SCRIPT (2–3 MINUTES)
1. Open Home and scroll through SIGNAL → GAP → PRIORITY → VERIFIED.
2. Open Dashboard: show two demo localities with the same warning and different resources/priority.
3. Open Locality B: explain each factor and coverage gap.
4. Show recommended water/cooling action and run what-if (labelled Modelled).
5. Coordinator approves and assigns; responder marks completion claimed; verifier adds evidence and verifies.
6. Show coverage and priority recalculated and the new snapshot/Impact before-after.
7. Show data labels, methodology/limitations and source links. State what is working, what is demo, and what future integrations require.
START NOW
Perform Phase 0 only. Inspect the actual repository and report findings. Do not edit until the inspection report and smallest Phase 1 plan are presented.