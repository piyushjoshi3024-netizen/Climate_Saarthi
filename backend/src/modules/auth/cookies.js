// HTTP-only session cookies. JavaScript in the browser can never read them.
export const ACCESS_COOKIE = 'cs_access';
export const REFRESH_COOKIE = 'cs_refresh';
export const REFRESH_PATH = '/api/v1/auth';

const base = (auth) => ({
  httpOnly: true,
  secure: auth.cookieSecure,
  sameSite: auth.cookieSameSite,
});

export function setSessionCookies(res, { accessToken, refreshToken }, auth) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...base(auth), path: '/', maxAge: auth.accessTtlMs });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base(auth), path: REFRESH_PATH, maxAge: auth.refreshTtlMs });
}

export function clearSessionCookies(res, auth) {
  res.clearCookie(ACCESS_COOKIE, { ...base(auth), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base(auth), path: REFRESH_PATH });
}
