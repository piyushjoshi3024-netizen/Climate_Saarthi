// Auth workflows: register, login, refresh (rotation + reuse detection), logout, bootstrap admin.
import bcrypt from 'bcryptjs';
import { ApiError } from '../../utils/response.js';
import { signAccessToken, newRefreshToken, newFamilyId, hashRefreshToken } from './tokens.js';
import { isPublicRole } from './auth.schemas.js';
import { isStaff } from './roles.js';

// Compared against when the email is unknown, so response time doesn't reveal account existence.
const DUMMY_HASH = bcrypt.hashSync('climate-saarthi-timing-equaliser', 10);

const invalidCredentials = () => new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');

/** Public view of a user. Never includes password hash or token data. */
export const toPublicUser = (u) =>
  u && {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isStaff: isStaff(u.role),
    assignedLocalityIds: u.assignedLocalityIds ?? [],
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt ?? null,
  };

export function createAuthService({ store, auth, now = () => new Date() }) {
  async function issueSession(user, { familyId = newFamilyId(), userAgent } = {}) {
    const refreshToken = newRefreshToken();
    const at = now();
    await store.sessions.create({
      userId: String(user.id),
      tokenHash: hashRefreshToken(refreshToken, auth.refreshSecret),
      familyId,
      expiresAt: new Date(at.getTime() + auth.refreshTtlMs),
      userAgent: userAgent ? String(userAgent).slice(0, 200) : undefined,
    });
    const accessToken = signAccessToken(user, { secret: auth.accessSecret, ttlMs: auth.accessTtlMs });
    return { accessToken, refreshToken };
  }

  return {
    async register({ name, email, password, role }, ctx = {}) {
      if (!isPublicRole(role)) {
        throw new ApiError(400, 'ROLE_NOT_ALLOWED', 'Only Citizen, Volunteer or Organisation accounts can be created here');
      }
      const passwordHash = await bcrypt.hash(password, auth.bcryptRounds);
      let user;
      try {
        user = await store.users.create({ name, email, passwordHash, role });
      } catch (err) {
        if (err?.code === 'DUPLICATE_KEY') throw new ApiError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
        throw err;
      }
      await store.audit.append({ actorId: user.id, action: 'USER_REGISTERED', targetType: 'user', targetId: user.id, meta: { role } });
      const tokens = await issueSession(user, ctx);
      return { user: toPublicUser(user), tokens };
    },

    async login({ email, password }, ctx = {}) {
      const user = await store.users.findByEmail(email, { withPassword: true });
      const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok || user.status !== 'ACTIVE') throw invalidCredentials();
      await store.users.recordLogin(user.id, now());
      const tokens = await issueSession(user, ctx);
      return { user: toPublicUser(user), tokens };
    },

    /**
     * Rotate a refresh token. A token that was already rotated or revoked indicates theft
     * or replay: the whole session family is revoked.
     */
    async refresh(refreshToken, ctx = {}) {
      if (!refreshToken) throw new ApiError(401, 'SESSION_REQUIRED', 'Please sign in');
      const hash = hashRefreshToken(refreshToken, auth.refreshSecret);
      const session = await store.sessions.findByHash(hash);
      const at = now();
      if (!session) throw new ApiError(401, 'SESSION_INVALID', 'Your session is not valid. Please sign in again.');
      if (session.revokedAt || session.rotatedAt) {
        await store.sessions.revokeFamily(session.familyId, at);
        await store.audit.append({ actorId: session.userId, action: 'REFRESH_TOKEN_REUSE', targetType: 'session', targetId: session.familyId });
        throw new ApiError(401, 'SESSION_REVOKED', 'Your session was ended for security. Please sign in again.');
      }
      if (new Date(session.expiresAt).getTime() <= at.getTime()) {
        throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
      }
      const user = await store.users.findById(session.userId);
      if (!user || user.status !== 'ACTIVE') {
        await store.sessions.revokeFamily(session.familyId, at);
        throw new ApiError(401, 'SESSION_INVALID', 'Your session is not valid. Please sign in again.');
      }
      const nextToken = newRefreshToken();
      const nextHash = hashRefreshToken(nextToken, auth.refreshSecret);
      const claimed = await store.sessions.markRotated(hash, nextHash, at);
      if (!claimed) {
        // Lost a race with another request using the same token: treat as reuse.
        await store.sessions.revokeFamily(session.familyId, at);
        throw new ApiError(401, 'SESSION_REVOKED', 'Your session was ended for security. Please sign in again.');
      }
      await store.sessions.create({
        userId: String(user.id),
        tokenHash: nextHash,
        familyId: session.familyId,
        expiresAt: new Date(at.getTime() + auth.refreshTtlMs),
        userAgent: ctx.userAgent ? String(ctx.userAgent).slice(0, 200) : undefined,
      });
      const accessToken = signAccessToken(user, { secret: auth.accessSecret, ttlMs: auth.accessTtlMs });
      return { user: toPublicUser(user), tokens: { accessToken, refreshToken: nextToken } };
    },

    async logout(refreshToken) {
      if (!refreshToken) return;
      const hash = hashRefreshToken(refreshToken, auth.refreshSecret);
      const session = await store.sessions.findByHash(hash);
      if (session) await store.sessions.revokeFamily(session.familyId, now());
    },

    /** Create the first admin from configuration if no admin exists yet. Idempotent. */
    async bootstrapAdmin({ email, password, name }) {
      if ((await store.users.countByRole('ADMIN')) > 0) return { created: false, reason: 'an admin already exists' };
      if (String(password).length < 12) throw new Error('Bootstrap admin password must be at least 12 characters');
      const passwordHash = await bcrypt.hash(password, auth.bcryptRounds);
      const user = await store.users.create({ name, email, passwordHash, role: 'ADMIN' });
      await store.audit.append({ actorId: 'system', action: 'ADMIN_BOOTSTRAPPED', targetType: 'user', targetId: user.id });
      return { created: true, user: toPublicUser(user) };
    },
  };
}
