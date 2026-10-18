import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, onSessionExpired } from '@/lib/api';

/**
 * Session state for the app. The server owns the session (HTTP-only cookies); the client
 * only knows what GET /auth/session reports. Route guards here are UX only; the API
 * enforces every permission server-side.
 */
const AuthContext = createContext(null);
export const SESSION_KEY = ['auth', 'session'];

export const STAFF_ROLES = ['COORDINATOR', 'ADMIN'];
export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  VOLUNTEER: 'Volunteer',
  ORGANIZATION: 'Organisation',
  RESPONDER: 'Responder',
  COORDINATOR: 'Coordinator',
  ADMIN: 'Admin',
};

export const homeFor = (user) => (user && STAFF_ROLES.includes(user.role) ? '/admin' : '/workspace');

/** Only follow internal redirect targets the user's role can open. */
export function safeRedirect(from, user) {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return homeFor(user);
  if (['/login', '/register', '/admin/login'].includes(from)) return homeFor(user);
  if (from.startsWith('/admin') && !STAFF_ROLES.includes(user?.role)) return homeFor(user);
  return from;
}

const anonymous = (reason = null) => ({ authenticated: false, available: true, user: null, reason });

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [notice, setNotice] = useState(null);

  const session = useQuery({
    queryKey: SESSION_KEY,
    queryFn: ({ signal }) => api.get('/auth/session', { signal }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // A protected call failed and the silent refresh did not help.
  useEffect(
    () =>
      onSessionExpired(() => {
        qc.setQueryData(SESSION_KEY, anonymous('SESSION_EXPIRED'));
        setNotice('expired');
      }),
    [qc]
  );

  // The probe reports a session that just ended (expired or revoked elsewhere).
  const reason = session.data?.reason;
  useEffect(() => {
    if (reason === 'SESSION_EXPIRED' || reason === 'SESSION_REVOKED') setNotice('expired');
  }, [reason]);

  const setUser = useCallback(
    (user) => qc.setQueryData(SESSION_KEY, { authenticated: true, available: true, user, reason: null }),
    [qc]
  );

  const login = useCallback(
    async (values) => {
      const data = await api.post('/auth/login', values);
      setNotice(null);
      setUser(data.user);
      return data.user;
    },
    [setUser]
  );

  const register = useCallback(
    async (values) => {
      const data = await api.post('/auth/register', values);
      setNotice(null);
      setUser(data.user);
      return data.user;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Mark the session anonymous first (keeps the observed cache entry), then drop any
      // other cached private data. Removing the session entry itself would leave mounted
      // components watching a detached query and still showing the old user.
      qc.setQueryData(SESSION_KEY, anonymous());
      qc.removeQueries({ predicate: (q) => !['health', 'auth'].includes(q.queryKey[0]) });
    }
  }, [qc]);

  const value = useMemo(() => {
    let status = 'loading';
    if (session.isError) status = 'error';
    else if (session.data) {
      if (session.data.available === false) status = 'unavailable';
      else status = session.data.authenticated ? 'authenticated' : 'anonymous';
    }
    const user = session.data?.user ?? null;
    return {
      status,
      user,
      isStaff: Boolean(user && STAFF_ROLES.includes(user.role)),
      error: session.error,
      retry: () => session.refetch(),
      login,
      register,
      logout,
      notice,
      clearNotice: () => setNotice(null),
    };
  }, [session, login, register, logout, notice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
