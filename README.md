# Climate Saarthi

Heatwave response intelligence for India. **Alerts tell you where it is hot. Saarthi shows where help is missing.**

MERN, JavaScript only: React + Vite · Node.js + Express · MongoDB + Mongoose.

> **Current state:** UI shell, the pure Response Intelligence Engine (with tests), and **working sign-in**
> (registration, login, sessions, role-based access, staff console entry, audit log). Localities, resources,
> reports and the dashboard data are not built yet. See `PROJECT_BRIEF.md` for the phase plan,
> `docs/ENGINE.md` for formulas.

## Repository layout
```
climate-saarthi/
├─ frontend/                 React + Vite (JSX)
│  ├─ src/app/               router (code-split), providers, auth (session), i18n, route guard
│  ├─ src/pages/             public + user pages; src/pages/admin/ console pages
│  ├─ src/components/
│  │  ├─ layout/             Navbar, AccountMenu, MobileSheet, Footer, PageTransition, ApiStatus
│  │  ├─ auth/ forms/        sign-in shell, LoginForm, fields with show/hide password
│  │  ├─ dashboard/          CommunitySection (photo + call to action)
│  │  ├─ data/               DataLabel, PriorityBadge, DemoBanner, States, PageHeader, PhaseNotice
│  │  ├─ ui/                 shadcn-style JS primitives (button, card, badge, skeleton)
│  ├─ src/lib/               api.js (REST client), validation.js, utils.js, i18n/ (en, hi)
│  ├─ src/assets/images/     optimised photo (WebP 480/765 + JPEG fallback)
│  └─ src/data/solutions.js  the four climate-aspect cards (only source of aspect content)
├─ backend/                  Express (ESM .js)
│  ├─ src/config/            env (validated), logger
│  ├─ src/data/              store interface: mongo.store.js (Mongoose) and memory.store.js
│  ├─ src/modules/auth/      routes → service → store; tokens, cookies, schemas, roles
│  ├─ src/modules/admin/     admin routes (audit log)
│  ├─ src/middleware/        authenticate/authorize, validate, csrf, rateLimit, requireDatabase, error
│  ├─ src/engine/            pure Response Intelligence Engine
│  ├─ tests/                 engine/ (Vitest) and api/ (Vitest + Supertest)
│  └─ scripts/               create-admin.js, engine-worked-example.js
├─ scripts/check-phase1.mjs  guardrail checks
└─ docs/                     specs, ENGINE.md, ENGINE_WORKED_EXAMPLE.md (generated)
```

## Run locally
Requires Node.js 20+ (tested on 22) and, for normal use, MongoDB (local or Atlas).

```bash
# 1) backend
cd backend
npm install
cp .env.example .env        # set MONGODB_URI (and JWT secrets for anything beyond local dev)
npm run dev                 # http://localhost:5000/api/v1/health

# 2) frontend (second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173  (calls /api through the Vite proxy)
```

**No MongoDB yet?** Run the API with `npm run dev:memory`. Everything works, but data lives in memory and
disappears when the server stops. It is refused in production.

### First admin account
No credentials are hardcoded. Choose one:
- `npm run create-admin` in `backend/` (prompts for name, email, password; needs MongoDB), or
- set `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (12+ chars) and `BOOTSTRAP_ADMIN_NAME` in
  `backend/.env`; the first admin is created at startup if none exists (works with `dev:memory` too).

Then sign in at `/admin/login`. Public sign-up (`/register`) can only create Citizen, Volunteer or
Organisation accounts.

### Troubleshooting sign-in
| You see | Cause | Fix |
|---|---|---|
| "Sign-in is unavailable … database is not connected" | API can't reach MongoDB | Start MongoDB / fix `MONGODB_URI`, or use `npm run dev:memory` |
| "Could not reach the Climate Saarthi server" | API not running | `npm run dev` in `backend/` |
| Signed out after restarting the API | Dev uses random secrets when `JWT_*` are placeholders | Set real `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` |
| Footer says "API: not reachable" in preview | Old `frontend/.env` with a full API URL | Use `VITE_API_BASE_URL=/api/v1` (proxy) |

## Scripts
| Where | Script | What it does |
|---|---|---|
| backend | `npm run dev` | API with MongoDB (`node --watch`) |
| backend | `npm run dev:memory` | API with the in-memory store (local only) |
| backend | `npm start` | API |
| backend | `npm test` | All tests: engine (38) + auth API (17) |
| backend | `npm run create-admin` | Create an admin in MongoDB |
| backend | `npm run engine:example` | Regenerate `docs/ENGINE_WORKED_EXAMPLE.md` |
| frontend | `npm run dev` / `build` / `preview` | Vite on :5173 / production build / serve build on :4173 |
| root | `npm run check` | Guardrails: no TypeScript, no Phase 7–8 packages, four aspect cards in order, disclaimer, no client secrets |

## Environment variables
**backend/.env** (see `.env.example` for comments)
- `NODE_ENV`, `PORT`, `CLIENT_ORIGIN` (exact origins, comma-separated), `LOG_LEVEL`, `TRUST_PROXY`
- `DATA_STORE` (`mongo` | `memory`), `MONGODB_URI`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL` (15m), `REFRESH_TOKEN_TTL` (7d),
  `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `BCRYPT_ROUNDS`
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME` (optional)

Production refuses to start without MongoDB, strong distinct JWT secrets and `COOKIE_SECURE=true`.

**frontend/.env** — `VITE_API_BASE_URL` (default `/api/v1`, same-origin through the Vite proxy) and
`VITE_PROXY_TARGET` (default `http://localhost:5000`). Anything prefixed `VITE_` is public.

## How sign-in works
- Passwords hashed with bcrypt (`bcryptjs`, cost 12). Never logged or returned.
- **Access token**: 15-minute JWT in an HTTP-only `cs_access` cookie (also accepted as `Authorization: Bearer`
  for API clients). The user record is re-read on every request, so disabled accounts lose access at once.
- **Refresh token**: random, HTTP-only `cs_refresh` cookie scoped to `/api/v1/auth`, stored only as an HMAC
  hash, **rotated on every use**. Re-using an old token revokes the whole session family and is audited.
- **CSRF**: SameSite cookies + exact-origin CORS + a required `X-CS-CSRF: 1` header on every
  POST/PATCH/PUT/DELETE.
- Rate limits on login (per IP + email) and on registration/refresh. One generic error for wrong email or
  password.
- If the database is down, auth routes return `503 DATABASE_UNAVAILABLE` instead of hanging, and the UI says so.
- React route guards are UX only. Every protected API route checks session and role on the server.

## API (implemented)
Base: `/api/v1`. Envelope: `{ success, data, message }` or `{ success:false, message, error:{ code } }`.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | Public | Status, `dataStore`, `database`, `signInAvailable` |
| POST | `/auth/register` | Public | `{ name, email, password, role? }`; role ∈ CITIZEN / VOLUNTEER / ORGANIZATION, else 400 `ROLE_NOT_ALLOWED`. Signs in (201) |
| POST | `/auth/login` | Public | `{ email, password }`; 401 `INVALID_CREDENTIALS`; 429 `RATE_LIMITED` |
| POST | `/auth/refresh` | Refresh cookie | Rotates tokens; reuse → 401 `SESSION_REVOKED` |
| POST | `/auth/logout` | Any | Revokes the session family, clears cookies |
| GET | `/auth/me` | Signed in | Current user |
| GET | `/auth/session` | Public | Always 200: `{ authenticated, available, user, reason }`; restores from refresh cookie |
| GET | `/admin/audit` | Admin | Latest audit entries (`?limit=1..100`). Coordinator → 403 |

Thunder Client: send `X-CS-CSRF: 1` on POST requests; cookies are kept by the client, or use the Bearer header.

The full planned catalogue is in `docs/DATASETS_AND_API.md` §7. Endpoints are listed here only once they
exist and are tested.

## Frontend routes
Public: `/`, `/dashboard`, `/map`, `/locality/:id`, `/resources`, `/report`, `/track`, `/impact`,
`/methodology`, `/solutions`, `/simulator`; `/learn` → `/solutions`.
Signed in: `/workspace`, `/profile`; `/responses` (responder, coordinator, admin).
Console (coordinator, admin): `/admin`, `/admin/queue`, `/admin/verification`, `/admin/signals`,
`/admin/localities`, `/admin/resources`, `/admin/reports`; admin only: `/admin/weights`, `/admin/audit`.
Sign-in: `/login`, `/register`, `/admin/login`. Also `/403` and 404.

Anonymous visitors to protected pages are sent to sign-in and returned afterwards; wrong roles see 403.

## Data labels
| Label | Meaning |
|---|---|
| Official | From a named official publication; source, URL, issue time, validity |
| Curated | Checked by the team/moderator; who and when |
| Demo | Synthetic (`is_demo: true`); never counted in real-only totals |
| Modelled | Engine or what-if output; version and link to `/methodology` |

The "Demo data. Not an assessment of real localities." notice appears next to ranked demo data only (from the
dashboard data phase), not as a banner on every page.

## Official sources (references, not live feeds)
- IMD district-wise warnings — https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php
- NCDC climate change and health — https://ncdc.mohfw.gov.in/includes/About/CentresAndDivision/CEOH.php
- CWC Flood Forecasting — https://ffs.india-water.gov.in/ · CWC 7-day advisory — https://aff.india-water.gov.in/
- NDMA — https://ndma.gov.in/
- CPCB National AQI — https://airquality.cpcb.gov.in/AQI_India/ · CAQM — https://caqm.nic.in/
- CGWB groundwater assessment — https://cgwb.gov.in/index.php/en/ground-water-resource-assessment-0
- India-WRIS — https://indiawris.gov.in/wris/

## Known limitations
- Dashboard, map, locality, resources, report, track and impact pages are still shells (no data yet).
- The MongoDB store is written and its models validated, but it has not been run against a live MongoDB in
  this environment (tests use the in-memory store with the same interface). Run `npm run dev` against your
  MongoDB to confirm.
- Coordinator locality scoping is stored (`assignedLocalityIds`) but only enforced once locality data exists.
- No password reset or email verification yet.
- The dashboard photo is illustrative and labelled as such.
- Hindi covers navigation, banners, account menu and footer; page bodies are English. Strings need review by a
  fluent speaker.

## Emergency
In an emergency call 112 (ambulance 108). Climate Saarthi is not an emergency service.
