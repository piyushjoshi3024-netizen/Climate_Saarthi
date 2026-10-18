// Auth API integration tests: real Express app + Supertest + in-memory store.
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createMemoryStore } from '../../src/data/memory.store.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { env } from '../../src/config/env.js';

const CSRF = { 'x-cs-csrf': '1' };
const PASSWORD = 'correct-horse-battery';

let store;
let app;

function freshApp(storeOverride) {
  store = storeOverride ?? createMemoryStore();
  app = createApp({ store, limits: { login: { limit: 5 }, write: { limit: 1000 } } });
  return app;
}

const cookieValue = (res, name) =>
  (res.headers['set-cookie'] ?? []).map((c) => c.split(';')[0]).find((c) => c.startsWith(`${name}=`))?.split('=')[1] ?? null;

async function register(agent, body = {}) {
  return agent
    .post('/api/v1/auth/register')
    .set(CSRF)
    .send({ name: 'Asha Citizen', email: 'asha@example.org', password: PASSWORD, ...body });
}

async function makeStaff(role, email) {
  // Staff accounts are provisioned by an admin, never by public sign-up.
  const svc = createAuthService({ store, auth: env.auth });
  if (role === 'ADMIN') return svc.bootstrapAdmin({ email, password: 'admin-password-123', name: 'Admin' });
  const bcrypt = (await import('bcryptjs')).default;
  return store.users.create({ name: role, email, passwordHash: await bcrypt.hash('staff-password-123', 4), role });
}

beforeEach(() => {
  freshApp(); // don't return the app: Vitest would treat a returned function as a cleanup hook
});

describe('registration', () => {
  it('creates a citizen, sets HTTP-only cookies and never returns the password', async () => {
    const res = await register(request(app));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ email: 'asha@example.org', role: 'CITIZEN', isStaff: false });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
    const cookies = res.headers['set-cookie'].join('\n');
    expect(cookies).toMatch(/cs_access=.*HttpOnly/);
    expect(cookies).toMatch(/cs_refresh=.*Path=\/api\/v1\/auth.*HttpOnly/);
    expect(cookies).toMatch(/SameSite=Lax/);
  });

  it('allows VOLUNTEER and ORGANIZATION but rejects privileged roles', async () => {
    expect((await register(request(app), { email: 'v@example.org', role: 'VOLUNTEER' })).status).toBe(201);
    expect((await register(request(app), { email: 'o@example.org', role: 'ORGANIZATION' })).status).toBe(201);
    for (const role of ['ADMIN', 'COORDINATOR', 'RESPONDER', 'SUPERUSER']) {
      const res = await register(request(app), { email: `${role}@example.org`, role });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ROLE_NOT_ALLOWED');
    }
  });

  it('validates input and rejects unknown fields', async () => {
    const res = await register(request(app), { email: 'not-an-email', password: 'short', isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.details.fields)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('rejects a duplicate email (case-insensitive)', async () => {
    await register(request(app));
    const res = await register(request(app), { email: 'ASHA@example.org' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });
});

describe('login, me, logout', () => {
  it('signs in and reads the profile from the cookie', async () => {
    await register(request(app));
    const agent = request.agent(app);
    const login = await agent.post('/api/v1/auth/login').set(CSRF).send({ email: 'Asha@Example.org', password: PASSWORD });
    expect(login.status).toBe(200);
    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('asha@example.org');
  });

  it('uses one generic error for wrong password and unknown email', async () => {
    await register(request(app));
    const wrong = await request(app).post('/api/v1/auth/login').set(CSRF).send({ email: 'asha@example.org', password: 'nope-nope-nope' });
    const unknown = await request(app).post('/api/v1/auth/login').set(CSRF).send({ email: 'ghost@example.org', password: 'nope-nope-nope' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rate-limits repeated failed sign-ins', async () => {
    let last;
    for (let i = 0; i < 6; i++) {
      last = await request(app).post('/api/v1/auth/login').set(CSRF).send({ email: 'x@example.org', password: 'wrong-wrong' });
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('RATE_LIMITED');
  });

  it('signs out: cookies cleared and the refresh token is revoked', async () => {
    const agent = request.agent(app);
    const reg = await register(agent);
    const refresh = cookieValue(reg, 'cs_refresh');
    const out = await agent.post('/api/v1/auth/logout').set(CSRF);
    expect(out.status).toBe(200);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    const reuse = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `cs_refresh=${refresh}`);
    expect(reuse.status).toBe(401);
  });
});

describe('refresh rotation', () => {
  it('rotates the refresh token, and reuse of an old token revokes the whole session', async () => {
    const reg = await register(request(app));
    const first = cookieValue(reg, 'cs_refresh');

    const r1 = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `cs_refresh=${first}`);
    expect(r1.status).toBe(200);
    const second = cookieValue(r1, 'cs_refresh');
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);

    // Replaying the first token is treated as theft…
    const replay = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `cs_refresh=${first}`);
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('SESSION_REVOKED');
    // …which also kills the legitimate newer token.
    const after = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `cs_refresh=${second}`);
    expect(after.status).toBe(401);
    expect((await store.audit.list()).some((e) => e.action === 'REFRESH_TOKEN_REUSE')).toBe(true);
  });

  it('session probe restores a session from the refresh cookie and is 200 when signed out', async () => {
    const anon = await request(app).get('/api/v1/auth/session');
    expect(anon.status).toBe(200);
    expect(anon.body.data).toMatchObject({ authenticated: false, available: true });

    const reg = await register(request(app));
    const refresh = cookieValue(reg, 'cs_refresh');
    const res = await request(app).get('/api/v1/auth/session').set('Cookie', `cs_refresh=${refresh}`);
    expect(res.body.data.authenticated).toBe(true);
    expect(cookieValue(res, 'cs_access')).toBeTruthy();
  });

  it('rejects a tampered access token', async () => {
    const reg = await register(request(app));
    const token = cookieValue(reg, 'cs_access');
    const tampered = token.slice(0, -3) + (token.endsWith('aaa') ? 'bbb' : 'aaa');
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `cs_access=${tampered}`);
    expect(res.status).toBe(401);
  });
});

describe('role-based access (server-side)', () => {
  it('admin endpoints: 401 anonymous, 403 citizen, 403 coordinator, 200 admin', async () => {
    expect((await request(app).get('/api/v1/admin/audit')).status).toBe(401);

    const citizen = request.agent(app);
    await register(citizen);
    expect((await citizen.get('/api/v1/admin/audit')).status).toBe(403);

    await makeStaff('COORDINATOR', 'coord@example.org');
    const coord = request.agent(app);
    await coord.post('/api/v1/auth/login').set(CSRF).send({ email: 'coord@example.org', password: 'staff-password-123' });
    expect((await coord.get('/api/v1/admin/audit')).status).toBe(403);

    await makeStaff('ADMIN', 'admin@example.org');
    const admin = request.agent(app);
    const login = await admin.post('/api/v1/auth/login').set(CSRF).send({ email: 'admin@example.org', password: 'admin-password-123' });
    expect(login.body.data.user).toMatchObject({ role: 'ADMIN', isStaff: true });
    const audit = await admin.get('/api/v1/admin/audit');
    expect(audit.status).toBe(200);
    expect(audit.body.data.items.map((i) => i.action)).toEqual(expect.arrayContaining(['USER_REGISTERED', 'ADMIN_BOOTSTRAPPED']));
  });

  it('accepts Bearer tokens for API clients', async () => {
    const reg = await register(request(app));
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${cookieValue(reg, 'cs_access')}`);
    expect(res.status).toBe(200);
  });

  it('bootstrap admin is idempotent', async () => {
    const svc = createAuthService({ store, auth: env.auth });
    expect((await svc.bootstrapAdmin({ email: 'a@example.org', password: 'admin-password-123', name: 'A' })).created).toBe(true);
    expect((await svc.bootstrapAdmin({ email: 'b@example.org', password: 'admin-password-123', name: 'B' })).created).toBe(false);
  });
});

describe('request safety', () => {
  it('requires the CSRF header on state-changing requests', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@example.org', password: 'whatever-x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_HEADER_MISSING');
  });

  it('returns 503 with a clear message when the database is down, and the probe stays 200', async () => {
    const down = { ...createMemoryStore(), isReady: () => false, status: () => 'disconnected' };
    freshApp(down);
    const res = await register(request(app));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    const probe = await request(app).get('/api/v1/auth/session');
    expect(probe.status).toBe(200);
    expect(probe.body.data.available).toBe(false);
    const health = await request(app).get('/api/v1/health');
    expect(health.body.data).toMatchObject({ database: 'disconnected', signInAvailable: false });
  });

  it('uses the standard error envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: expect.any(String), error: { code: 'ROUTE_NOT_FOUND' } });
  });
});
