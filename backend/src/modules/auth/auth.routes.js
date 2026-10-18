import { Router } from 'express';
import { ok } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { requireDatabase } from '../../middleware/requireDatabase.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter, authWriteLimiter } from '../../middleware/rateLimit.js';
import { RegisterSchema, LoginSchema } from './auth.schemas.js';
import { createAuthService, toPublicUser } from './auth.service.js';
import { setSessionCookies, clearSessionCookies, REFRESH_COOKIE, ACCESS_COOKIE } from './cookies.js';
import { verifyAccessToken } from './tokens.js';

/**
 * /auth routes. Controllers stay thin: HTTP in/out only; workflows live in auth.service.js.
 */
export function authRouter({ store, auth, limits = {} }) {
  const router = Router();
  const service = createAuthService({ store, auth });
  const db = requireDatabase(store);
  const ctx = (req) => ({ userAgent: req.get('user-agent') });

  router.post('/register', db, authWriteLimiter(limits.write), validate({ body: RegisterSchema }), async (req, res) => {
    const { user, tokens } = await service.register(req.body, ctx(req));
    setSessionCookies(res, tokens, auth);
    ok(res, { user }, 'Account created', 201);
  });

  router.post('/login', db, loginLimiter(limits.login), validate({ body: LoginSchema }), async (req, res) => {
    const { user, tokens } = await service.login(req.body, ctx(req));
    setSessionCookies(res, tokens, auth);
    ok(res, { user }, 'Signed in');
  });

  router.post('/refresh', db, authWriteLimiter(limits.write), async (req, res) => {
    try {
      const { user, tokens } = await service.refresh(req.cookies?.[REFRESH_COOKIE], ctx(req));
      setSessionCookies(res, tokens, auth);
      ok(res, { user }, 'Session refreshed');
    } catch (err) {
      clearSessionCookies(res, auth);
      throw err;
    }
  });

  router.post('/logout', async (req, res) => {
    if (store.isReady()) await service.logout(req.cookies?.[REFRESH_COOKIE]);
    clearSessionCookies(res, auth);
    ok(res, {}, 'Signed out');
  });

  router.get('/me', db, authenticate({ store, auth }), (req, res) => {
    ok(res, { user: toPublicUser(req.user) });
  });

  /**
   * Public session probe used when the app loads. Always 200 so anonymous visitors don't
   * produce console errors. Restores the session from the refresh cookie when the access
   * token has expired.
   */
  router.get('/session', async (req, res) => {
    if (!store.isReady()) {
      return ok(res, { authenticated: false, available: false, user: null, reason: 'DATABASE_UNAVAILABLE' });
    }
    const access = req.cookies?.[ACCESS_COOKIE];
    if (access) {
      const v = verifyAccessToken(access, { secret: auth.accessSecret });
      if (v.ok) {
        const user = await store.users.findById(v.payload.sub);
        if (user && user.status === 'ACTIVE' && (user.tokenVersion ?? 0) === (v.payload.tv ?? 0)) {
          return ok(res, { authenticated: true, available: true, user: toPublicUser(user) });
        }
      }
    }
    const refresh = req.cookies?.[REFRESH_COOKIE];
    if (refresh) {
      try {
        const { user, tokens } = await service.refresh(refresh, ctx(req));
        setSessionCookies(res, tokens, auth);
        return ok(res, { authenticated: true, available: true, user });
      } catch (err) {
        clearSessionCookies(res, auth);
        return ok(res, { authenticated: false, available: true, user: null, reason: err?.code ?? 'SESSION_INVALID' });
      }
    }
    if (access) clearSessionCookies(res, auth);
    return ok(res, { authenticated: false, available: true, user: null, reason: null });
  });

  return { router, service };
}
