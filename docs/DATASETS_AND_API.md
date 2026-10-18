Climate Saarthi — Dataset & API README
Project: Climate Saarthi — India-first Climate Response Intelligence Platform
Stack: MongoDB + Mongoose, Express.js, Node.js, React + Vite (JavaScript only)
API prefix: /api/v1
Primary live workflow: Heatwave response gaps in one pilot city. The website showcases exactly four climate aspects—Heat Exposure Planner (heatwaves), FloodReady India (floods), CleanAir Connect (air pollution), and JalSanjivani (drought/water stress). Only heatwave is an active hazard engine in the MVP; the other three are informational concepts unless later implemented.

1. Product purpose
Climate Saarthi is not just a weather dashboard or complaint CRUD app. It identifies where an official climate signal meets insufficient local response capacity, explains the gap, recommends an intervention, supports human assignment and verification, and recalculates coverage and priority after the intervention is verified.
Core loop
Official signal → Risk → Local context → Resources/response → Coverage → Gap → Priority → Recommended intervention → Approval/assignment → Response → Evidence-based verification → Recalculation → Updated coverage/priority
The engine is decision support only. It does not forecast weather, diagnose health conditions, replace public authorities, automatically dispatch emergency services, or claim that lives were saved.
2. Applications and architecture
React + Vite frontend (JavaScript/JSX)
  ├─ React Router, Tailwind, shadcn/ui (JavaScript configuration)
  ├─ TanStack Query/Table, React Hook Form + Zod
  ├─ Motion for small UI transitions
  ├─ GSAP + ScrollTrigger for the Home scroll story
  ├─ Lenis optional, Swiper optional, React Three Fiber on Home only
  └─ Leaflet/OpenStreetMap + Recharts
         │ HTTPS REST / optional Socket.IO
         ▼
Node.js + Express modular monolith (JavaScript)
  ├─ Routes → controllers → services → engine/repositories
  ├─ JWT authentication, bcrypt, RBAC, Zod validation
  ├─ Response Intelligence engine (deterministic, side-effect-free calculations)
  ├─ Optional Redis cache / BullMQ jobs only when needed
  └─ Optional Socket.IO for meaningful real-time events
         │
         ▼
MongoDB + Mongoose
- The browser never connects directly to MongoDB.
- Use .js for regular modules and .jsx for React components. No TypeScript files or static type annotations.
- Keep controller logic thin. Controllers handle HTTP; services orchestrate workflows; repositories handle persistence; engine functions calculate without Express or database I/O.
- Make backend calculations authoritative. A client-side what-if preview must be labelled Modelled; it must never write data directly.
3. Data labels and provenance
Every displayed dataset, resource, signal, metric, chart and generated recommendation must expose one of these labels:
Label	Meaning	Required metadata
Official	Directly sourced from a named official publication/record	Source name, source URL, issue/publish time, retrieval time; validity window for warnings
Curated	Checked by the project team or an authorised moderator	Verifier, lastCheckedAt, source/evidence link where available
Demo	Synthetic seed data for product demonstration	is_demo: true, demoScenario, conspicuous demo badge
Modelled	Calculated by the response engine, a what-if calculation, or an optimiser	Calculation time, engine/config version, formula/assumption link to /methodology


Demo records must have is_demo: true and must not be mixed into “real-only” totals. Do not call synthetic scores official risk assessments. On every ranked demo view, show: “Demo data. Not an assessment of real localities.”
4. Dataset catalogue and official references
These are source portals and reference pages, not a claim that every portal exposes a stable, documented API. Inspect the individual dataset/resource page, terms, licence, update cadence and access method before coding an integration. If access is a webpage/PDF/CSV, use a curator-reviewed import and preserve its provenance. Do not scrape a site and describe it as a live API.
Climate aspect	Possible source / dataset	Use in Climate Saarthi	Access rule / caution
1. Heatwaves / urban heat	IMD district-wise warnings, IMD district heatwave warnings, NCDC heat-health programme	Official warning link, warning colour/level, issue time and validity; curated heat-safety guidance	MVP: admin enters an official signal with source URL/time or imports a validated CSV. No undocumented live scraping.
2. Air pollution	CPCB National AQI, CAQM	Station AQI/pollutants, station timestamp, NCR response guidance	Station readings vary geographically. Verify a supported data interface before integration; otherwise link to the official portal and label imported records.
3. Flooding / drainage	CWC Flood Forecasting, CWC 7-day advisory, NDMA	Link to official alerts; curated/verified reports of waterlogging, drain blockages and resource locations	Do not create flood forecasts from illustrative map pins. No undocumented API assumptions.
4. Drought / groundwater	CGWB groundwater resource assessment, India-WRIS	Assessment-unit category, assessment year, water-resource context and verified conservation projects	Preserve geographic resolution and assessment year. Block-level assessment is not a household water-supply measurement.
5. Climate-resilient farming	ICAR, NICRA information	Links to district contingency plans and relevant crop/advisory resources	Advice must be crop-, region- and date-relevant. Do not claim yield gains without seasonal evidence.
6. Food surplus / food waste	FSSAI Indian Food Sharing Alliance	Recovery-agency directory and verified donor/pickup workflows	Do not imply the portal exposes an open inventory API. Enforce food safety, pickup windows and partner verification.
7. Solid waste / plastics	MoEFCC rules and regulations, data.gov.in and local ULB portals	Segregation guidance, official rules, verified collection/recycler listings and moderated reports	Local collection schedules require municipality-level provenance and review.
8. Renewable energy adoption	MNRE / PM-KUSUM	Official scheme guidance, eligibility checklist and application links	Scheme periods and eligibility change. Link to current official information; do not guarantee subsidy or installation.
9. Electricity / efficiency	Bureau of Energy Efficiency	Standards/labels, efficiency guidance and official programme links	Calculators must expose assumptions; do not report saved kWh without measurements.
10. Sustainable transport	Relevant city transport/metro/bus authority, data.gov.in	Verified transit references, accessible-route reports and local initiatives	Dataset coverage differs by city. Do not assume a national feed or emissions baseline.
11. Forest / biodiversity	Green India Mission, relevant state forest department and ISRO	Restoration project references, moderated observations and monitoring records	Use only appropriately licensed layers/imagery; verify observations. Planting counts are not survival or habitat outcomes.
12. Climate-related health	NCDC / NPCCHH	Approved source-linked heat/health guidance and health-resource directory	Information only, not diagnosis or individual health-risk prediction. Never store medical information in community reports.
13. Low-income climate vulnerability	Aggregated official population/census/local plans, municipal or public programme data where available	Aggregate locality context for decision support	Avoid personal records, home addresses, or public labels identifying vulnerable individuals. Preserve source/year and uncertainty.
14. Rural resilience	MGNREGA work-planning portal and state/district plans	Public natural-resource-management project links and verified progress	Confirm financial year, district and status; distinguish planned/ongoing/completed work.
15. Green jobs / skills	Ministry of Skill Development and Entrepreneurship, relevant state skill missions and verified providers	Training/job directory with provider validation	Job listing availability is fragmented; verify provider and closing date. Do not promise placement.
16. Water quality / sanitation	Jal Jeevan Mission WQMIS	Official testing/lab references, curated test results and issue referrals	An untested source must never be labelled safe. Preserve test date, lab and measured parameters.
17. Disaster readiness	NDMA, CWC flood forecasting, IMD warnings	Official warning links, preparedness guidance and verified resource directories	Complements emergency authorities; not a dispatch or rescue service.
18. Climate education / participation	Mission LiFE, NCDC/IMD educational materials	Source-linked learning content and local action challenges	Measure repeated, verified action, not quiz clicks alone.


Cross-cutting open-data source
Open Government Data Platform India (data.gov.in) hosts datasets and resource APIs. Registered users can generate an API key, but an API does not exist for every resource. Before integration, identify the exact resource page and resource ID, check update cadence/licence, obtain credentials if required, and test pagination/fields/rate limits. Keep API keys on the backend. Never use a placeholder resource ID or present an unavailable endpoint as connected.
First release: data plan
1. Official climate signal: manually entered by an authorised admin with an official URL, issue timestamp, valid-until time, warning level and label; optionally imported from a source CSV after schema validation.
2. Locality context: six fictional/illustrative localities for the first demo. Clearly label demographics, centroids and polygons as demo/illustrative unless supported by a checked source and licence.
3. Resources: water points, cooling centres, health facilities and volunteer teams. Require source, verification status, capacity/unit, status, accessibility and lastVerifiedAt.
4. Reports: user-generated non-emergency field reports. Treat as unverified until moderator review. Store locality-level location only; never publish reporter contact details.
5. Engine output: risk, effective capacity, coverage, deficit, gap reasons, priority and recommendations are Modelled. Store the engine/config version so results can be explained.
6. Four-aspect UI limit: the website must display exactly four climate-aspect cards: (1) Heatwaves / urban heat — Heat Exposure Planner; (2) Floods — FloodReady India / Flood Impact Reporter; (3) Air pollution — CleanAir Connect / Pollution Exposure Comparator; (4) Drought and water stress — JalSanjivani / Water Stress Timeline. Other rows in this dataset catalogue are reference material only and must not appear as aspect cards or categories in the UI. Only the heatwave hazard is active in the MVP; do not enable unsupported live feeds or build the other three engines.
5. Canonical record shapes
Examples below document the intended contract, not a claim that these records already exist in a running database.
Locality
{
  "_id": "<mongo-id>",
  "name": "Ward B (demo)",
  "city": "Delhi",
  "state": "Delhi",
  "centroid": { "type": "Point", "coordinates": [77.20, 28.70] },
  "population": 25000,
  "vulnerablePopulation": 9000,
  "contextSource": "Synthetic demo fixture",
  "contextYear": 2026,
  "is_demo": true
}
Climate signal
{
  "hazardType": "HEATWAVE",
  "severity": "EXTREME",
  "warningLevel": "WARNING",
  "source": "India Meteorological Department",
  "sourceUrl": "https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php",
  "sourceTimestamp": "2026-10-17T06:00:00Z",
  "validUntil": "2026-10-17T18:00:00Z",
  "localityId": "<locality-id>",
  "label": "Demo",
  "is_demo": true
}
Use this only as a synthetic example; do not represent the example warning or timestamps as a real active IMD alert.
Resource
{
  "name": "Community Water Point 01 (demo)",
  "type": "WATER_POINT",
  "localityId": "<locality-id>",
  "location": { "type": "Point", "coordinates": [77.20, 28.70] },
  "capacity": 8000,
  "unit": "L/day",
  "availability": "AVAILABLE",
  "reliability": 0.75,
  "accessibility": 0.65,
  "status": "OPERATIONAL",
  "verificationStatus": "PENDING",
  "verifiedAt": null,
  "source": "Synthetic demo fixture",
  "is_demo": true
}
Report privacy
Public report fields may include localityId, type, short note, status, created/expiry timestamps and a public reference code. Store optional contact in a private field/collection or protect it with strict serializers and role checks. Never return it from a public GET /reports response. Reject medical diagnoses and unnecessary identity details; rate-limit public creation and use a honeypot/CAPTCHA strategy where appropriate.
Priority snapshot
A snapshot should include localityId, computedAt, risk, vulnerability, exposure, coverage, deficit, recency, trend, score, band, coverageByType, gapReasons, factorBreakdown, configVersion, label: "Modelled", and is_demo propagated from the input scenario. Include the factors, weights, reason text and assumptions that support “Why this score”.
6. API conventions
- Base URL locally: http://localhost:5000/api/v1 (adjust to actual .env).
- JSON request/response, UTC timestamps in storage; display India Standard Time in the UI.
- Paginate list endpoints (page, limit, optional sort, order); cap limit server-side.
- Filter endpoints by IDs, locality, type, status, severity, date window and includeDemo only where relevant.
- Validate body, params and query with Zod on the server.
- Return consistent responses:
Success:
{ "success": true, "data": {}, "message": "Success" }
Error:
{ "success": false, "message": "Resource not found", "error": { "code": "RESOURCE_NOT_FOUND" } }
Suggested status codes: 200 read/update success, 201 created, 400 validation error, 401 unauthenticated, 403 insufficient role/scope, 404 missing record, 409 duplicate/illegal state transition, 429 rate limited, 500 unexpected error. Never return stack traces in production.
7. REST endpoint catalogue
Role labels: Public = no login; User = signed-in citizen/volunteer/organisation/responder; Coordinator = coordinator plus admin; Admin = admin only. Every protected operation still verifies locality assignment and record ownership/scope on the server. The endpoints in sections marked “supporting” are additions required by the frontend screens; implement only when a visible feature uses them.
Health and authentication
Method	Endpoint	Access	Purpose
GET	/health	Public	Health/readiness response; no secrets
POST	/auth/register	Public	Register CITIZEN, VOLUNTEER or ORGANIZATION; never accept ADMIN/COORDINATOR role from public input
POST	/auth/login	Public	Verify credentials, issue/rotate session tokens
POST	/auth/refresh	Refresh session	Rotate refresh token/session; reject reused or revoked tokens
POST	/auth/logout	Signed in	Revoke/clear refresh session
GET	/auth/me	Signed in	Current profile and role
PATCH	/users/me	Signed in	Update allowed profile fields (supporting)
GET	/users	Admin	Search/manage users (supporting, if admin UI uses it)
PATCH	/users/:id/role	Admin	Change role with audit record; disallow privilege escalation by non-admin (supporting)


Passwords must be bcrypt-hashed. Do not log passwords/tokens. Prefer short-lived access tokens and rotating refresh tokens in secure HTTP-only cookies (or document the chosen secure storage model); apply exact-origin CORS, Helmet, rate limits and CSRF protection if cookie auth requires it. Generic login errors must not reveal whether an email exists.
Localities and context
Method	Endpoint	Access	Purpose
POST	/localities	Admin	Create locality/context
GET	/localities	Public	List pilot localities; demo label included
GET	/localities/:id	Public	Locality detail
PATCH	/localities/:id	Admin	Update context with source/year provenance
GET	/localities/:id/intelligence	Public	Aggregate intelligence snapshot
GET	/admin/localities/unmapped	Coordinator	Review unmapped imports (supporting)


Use GeoJSON [longitude, latitude] Points and 2dsphere indexes for geospatial records. Use illustrative polygons only with a clear map note unless a sourced, licensed boundary file is available.
Climate signals
Method	Endpoint	Access	Purpose
POST	/climate/signals	Coordinator	Enter an official/curated/demo signal with source URL and issue/validity times
GET	/climate/signals	Public	List/filter signals; expose label and timestamps
GET	/climate/signals/:id	Public	Signal detail/source
PATCH	/climate/signals/:id	Coordinator	Correct or expire a signal with audit entry
GET	/climate/risk/:localityId	Public	Return calculated risk and factor explanation
POST	/admin/climate/signals/import	Admin	Validate/import CSV; invalid/unmapped rows go to review queue (supporting)


No invented live IMD/NDMA/CPCB adapters. Make an OfficialSignalProvider JavaScript adapter contract, but keep it unconfigured until a real supported data access route is verified.
Resources and critical sites
Method	Endpoint	Access	Purpose
POST	/resources	Coordinator	Propose/add a resource
GET	/resources	Public	Filter by type, locality, status, verification and recency
GET	/resources/:id	Public	Resource detail, source and last-verified date
GET	/resources/nearby	Public	Geospatial lookup with radius and category filters
PATCH	/resources/:id	Coordinator	Update capacity/status/accessibility/source
PATCH	/resources/:id/verify	Coordinator	Curator verification and audit entry (supporting)
PATCH	/resources/:id/stale	Coordinator	Mark old/incorrect listing stale (supporting)
POST	/critical-sites	Coordinator	Add verified critical site
GET	/critical-sites	Public	List/filter critical sites with labels
PATCH	/critical-sites/:id	Coordinator	Update site record (supporting)


Community reports
Method	Endpoint	Access	Purpose
POST	/reports	Public	Submit a non-emergency ground report; rate-limit and validate
GET	/reports	Coordinator	List/triage reports (public response board should use a separate anonymised serializer)
GET	/reports/:id	Reporter owner/coordinator/admin	Detail with private fields only for authorised roles
PATCH	/reports/:id/status	Coordinator	Review, mark duplicate/spam, resolve or expire
POST	/reports/:id/confirm	Public with reference/token or signed-in user	“Still not fixed” / “Appears fixed” as supporting evidence only (supporting)
GET	/reports/track/:referenceCode	Public	Anonymised status timeline; never reveal contact or internal notes (supporting)


Response Intelligence
Method	Endpoint	Access	Purpose
GET	/intelligence/:localityId	Public	Full read-only intelligence summary
GET	/intelligence/:localityId/risk	Public	Risk factor output
GET	/intelligence/:localityId/coverage	Public	Demand, effective capacity, coverage and deficit per resource type
GET	/intelligence/:localityId/gaps	Public	Typed response-gap reasons
GET	/intelligence/:localityId/priority	Public	Score, band, trend, factor breakdown and “Why this score” reasons
GET	/intelligence/:localityId/interventions	Public	Ranked recommendations (no assignment side effects)
POST	/intelligence/what-if	Signed in	Run a copy-only simulation; must not mutate MongoDB
POST	/intelligence/:localityId/recalculate	Coordinator/Admin	Request an authoritative recalculation and snapshot (supporting)


Interventions, responses, verification
Method	Endpoint	Access	Purpose
GET	/interventions	Coordinator/Responder	Filter by state, priority, locality and assignee
POST	/interventions	Coordinator	Create from approved recommendation or manual action
GET	/interventions/:id	Scoped signed-in role	Detail and state timeline
PATCH	/interventions/:id	Coordinator	Edit permitted fields/state through validated transitions
POST	/responses	Coordinator	Create response record
GET	/responses	Responder/Coordinator	Responder sees assigned; coordinator sees permitted localities
GET	/responses/:id	Scoped signed-in role	Response detail
PATCH	/responses/:id/status	Assigned Responder/Coordinator	Start/in-progress/complete-claimed transitions
PATCH	/responses/:id/assign	Coordinator	Assign responder/organisation and due time
POST	/verifications	Coordinator/Admin (not the person completing, where feasible)	Record SUCCESS/PARTIAL/FAILED with evidence and verifier
GET	/verifications/:id	Scoped signed-in role	Verification record


State machine: RECOMMENDED → APPROVED → ASSIGNED → IN_PROGRESS → COMPLETED → VERIFICATION_PENDING → VERIFIED → CLOSED, plus REJECTED and EXPIRED. Reject illegal transitions with 409. A verified intervention must update the resource/response state, recalculate coverage/gaps/priority, create a snapshot and audit record, invalidate relevant caches, then emit relevant events/notifications. Community confirmation is evidence, not verification by itself.
Dashboard, impact and admin supporting endpoints
Method	Endpoint	Access	Purpose
GET	/impact/summary?includeDemo=false	Public	Labelled totals, real/demo separation and definitions (supporting)
GET	/impact/history	Public	Before/after and time-series data (supporting)
GET	/admin/queue/summary	Coordinator	Pending approvals, critical gaps, overdue responses and stale resources (supporting)
GET	/admin/engine-config	Coordinator	Read active assumptions/config
PATCH	/admin/engine-config	Admin	Change weights/thresholds/standards, validate and audit (stretch)
GET	/admin/audit	Admin	Filterable append-only audit log
GET	/methodology	Public	Return methodology/config explanation or render static frontend content


Socket.IO events (only if implemented)
Emit after a committed state change, to authorised rooms where possible: NEW_CLIMATE_SIGNAL, NEW_CRITICAL_REPORT, PRIORITY_UPDATED, INTERVENTION_CREATED, RESPONSE_ASSIGNED, RESPONSE_STATUS_CHANGED, VERIFICATION_COMPLETED, COVERAGE_UPDATED. Do not send private reporter data. If Socket.IO is not ready, implement refresh/polling and do not imply real-time delivery.
8. Response Intelligence engine notes
The engine must be deterministic, explainable and independently unit-tested. Keep config/assumptions centralised and versioned. The score is for triage support, not a validated measure of health harm.
- Risk: based on latest valid official signal, warning/severity, freshness/expiry, trend, local vulnerability/exposure and critical-site context. Expired signals must not keep contributing as current warnings.
- Coverage: effectiveCapacity = availableCapacity × reliability × accessibility × availabilityFactor. For each type, coverage = min(1, effectiveCapacity / requiredCapacity) × 100; deficit = 100 - coverage. Document capacity units and demand/service-standard assumptions.
- Gaps: detect missing resource, insufficient capacity, unavailable/stale/unverified/inaccessible resource, unresolved report and unsupported critical site.
- Priority: use risk, vulnerability, exposure, deficit, recency plus documented trend/critical-site/report modifiers. No randomness and no hardcoded final scores. Store factor breakdown, weights, reasons, config version and calculation timestamp.
- Bands (single canonical backend default): LOW 0–25, MODERATE 26–50, HIGH 51–75, CRITICAL 76–100. If the team intentionally chooses different thresholds, make them configuration-backed and document the single active definition in /methodology; do not mix competing bands across the frontend and backend.
- What-if: operate on an in-memory copy of state, return before/after estimates, never write MongoDB or invalidate real cache.
- Verification: only evidence-backed coordinator/admin verification triggers an authoritative recalculation and snapshot.
Minimum golden tests: same signal + different support → different priority; expired signal decays; stale/non-functional resources contribute little; a verified water point improves modelled coverage/priority; rising trend affects output deterministically; weights are validated/normalised; unmapped records go to review rather than being guessed.
9. Demo seed requirements
Use an idempotent seed command for a development/demo database only. Refuse a destructive reset against a production-looking database. Every synthetic document must have is_demo: true.
Minimum data from the backend brief: 10 users, 10 localities, 20 climate signals, 30 resources, 10 critical sites, 30 reports, 15 interventions, 10 responses and 10 verifications. For a six-hour presentation, seed at least the primary locality contrast below even if optional breadth is reduced:
- Locality A and Locality B have the same orange heat signal but different resource capacity/verification status.
- Locality A has two working water points and a cooling centre.
- Locality B has no verified water point and one stale resource.
- Locality C includes a hospital/school with unsupported coverage.
- Rohini, Delhi is the named narrative/example locality in the backend prompt; its numbers are synthetic demo inputs, not a real current risk assessment: population 25,000, vulnerable population 9,000, extreme heat example, rising trend, required water 25,000 L/day, available 8,000 L/day, reliability 0.75, accessibility 0.65, effective capacity 3,900 L/day, modelled coverage 15.6%.
- Add unresolved water reports, nearby hospital, no verified cooling centre, available tanker resources, and snapshots across seven demo days for trend UI.
Do not call these demo metrics official or claim actual impact.
10. Environment and local run guide
Create .env.example without actual secrets. Names may vary slightly with the inspected repo, but document them consistently:
Backend backend/.env
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/climate_saarthi_dev
JWT_ACCESS_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_different_long_random_secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
REDIS_URL=
LOG_LEVEL=info
Frontend frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
Only public API base URLs belong in VITE_*. Never place MongoDB credentials, JWT secrets, private API keys or privileged tokens in client environment variables.
Expected commands
Check actual package scripts in the repository and preserve them. Typical setup might be:
# backend
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev

# frontend, in a separate terminal
cd frontend
npm install
cp .env.example .env
npm run dev

# tests/build: use the scripts that the repo defines
npm test
npm run build
Do not claim these commands work until they have been tested against the actual package.json files. MongoDB must be running locally or reachable via MONGODB_URI. Redis/BullMQ/Socket.IO can remain optional for MVP if there is no demonstrated need; the core response loop must still work without them.
11. API testing with Thunder Client
Do not add Swagger/OpenAPI UI. Provide a Thunder Client collection and environment containing the API base URL plus test-only credentials set locally (do not commit secrets). Include requests for:
1. Register/login and /auth/me; refresh/logout; verify password never appears.
2. List localities and fetch one locality's risk/coverage/gaps/priority/interventions.
3. Create report → coordinator review → create/approve intervention → assign responder → progress/completion claimed → evidence-based verification.
4. After verification, refetch coverage/priority and confirm a new snapshot explains before/after.
5. Run what-if and confirm no MongoDB mutation.
6. Verify a public user cannot access coordinator/admin endpoints and cannot read reporter contact/internal notes.
7. Test invalid schema, unknown locality, expired signal, duplicate report handling, illegal state transition, rate limit and error response shape.
12. Security and privacy acceptance
- Helmet, exact-origin CORS, rate limits, bcrypt, Zod validation, centralized error handling, structured Pino logs (or another structured logger if already selected).
- RBAC is enforced on server routes and document queries, not only hidden in React. Roles: CITIZEN, VOLUNTEER, ORGANIZATION, RESPONDER, COORDINATOR, ADMIN.
- Public registration may create only low-privilege roles. Admin/coordinator accounts are provisioned securely by an admin; never accept privileged roles from self-registration.
- Coordinators can access only their assigned localities. Admin actions create append-only audit records.
- Use serializers/DTOs to omit contactPrivate, private notes, credentials, refresh tokens and sensitive fields from public responses.
- Locality-level public location only; never store public home addresses or medical/identity details in reports. Reports expire; validate length and sanitise plain text.
- Emergency disclaimer on report pages and footer: “In an emergency call 112 (ambulance 108). Climate Saarthi is not an emergency service.”
- No credentials in git. Production .env stays ignored.
13. Acceptance checklist
- [ ] npm run build passes for frontend and backend's startup/tests pass.
- [ ] Engine unit tests pass with deterministic fixtures.
- [ ] One full workflow completes through verification and recalculation.
- [ ] Same warning with different resource coverage produces a clearly explained different priority.
- [ ] Every metric/record carries Official, Curated, Demo or Modelled provenance.
- [ ] “Real only” impact totals exclude demo records.
- [ ] API access rules are tested as public, citizen, responder, coordinator and admin.
- [ ] What-if does not mutate MongoDB.
- [ ] Seed is idempotent, and demo reset is protected from production.
- [ ] No fake live integrations, fake notification-delivery claims, false impact claims or exposed secrets.
- [ ] The site still works with motion off, keyboard only, at 360px, and when WebGL is unavailable.
14. Reference links reviewed
- IMD district warnings: https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php
- IMD heatwave warnings: https://mausam.imd.gov.in/responsive/districtWiseHeatwaveWarning.php
- CPCB AQI: https://airquality.cpcb.gov.in/AQI_India/
- CWC flood forecasts: https://ffs.india-water.gov.in/
- CWC 7-day flood advisory: https://aff.india-water.gov.in/
- CGWB groundwater assessments: https://cgwb.gov.in/index.php/en/ground-water-resource-assessment-0
- India-WRIS: https://indiawris.gov.in/wris/
- Open Government Data India: https://www.data.gov.in/
- data.gov.in API help: https://www.data.gov.in/help
- NCDC climate and health: https://ncdc.mohfw.gov.in/includes/About/CentresAndDivision/CEOH.php
- Jal Jeevan Mission WQMIS: https://ejalshakti.gov.in/WQMIS/
- FSSAI Indian Food Sharing Alliance: https://sharefood.eatrightindia.gov.in/
- Green India Mission: https://moef.gov.in/green-india-mission-gim
- MNRE PM-KUSUM: https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/
- Bureau of Energy Efficiency: https://beeindia.gov.in/
- MGNREGA portal: https://mnregaweb4.nic.in/netnrega/
- Mission LiFE: https://missionlife-moefcc.nic.in/aboutLiFE.php?lang=en
Source-access caveat: Official pages may be public without exposing a stable public REST API. Treat the source page as a reference unless the exact dataset resource, API access and licence have been verified.