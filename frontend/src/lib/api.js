// Thin client for the Express REST API (/api/v1).
// The browser never talks to MongoDB; every call goes through here.
// Sessions live in HTTP-only cookies set by the server; this code never sees the tokens.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
  }
  /** Field-level validation messages from the server, if any. */
  get fields() {
    return this.details?.fields ?? {};
  }
}

// Session-expiry notifications for the auth provider.
const listeners = new Set();
export function onSessionExpired(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let refreshing = null;
function refreshSession() {
  // Single-flight: concurrent 401s share one refresh request.
  if (!refreshing) {
    refreshing = rawRequest('/auth/refresh', { method: 'POST' })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function buildUrl(path, query) {
  const full = BASE_URL + (path.startsWith('/') ? path : `/${path}`);
  const url = new URL(full, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function rawRequest(path, { method = 'GET', body, query, signal, headers } = {}) {
  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        // CSRF defence: the API rejects state-changing requests without this header.
        ...(UNSAFE.has(method) ? { 'X-CS-CSRF': '1' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the Climate Saarthi server. Check your connection, or that the backend is running.',
    });
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response; handled below.
  }

  if (!res.ok || !payload || payload.success !== true) {
    throw new ApiError({
      status: res.status,
      code: payload?.error?.code || (res.ok ? 'BAD_RESPONSE' : `HTTP_${res.status}`),
      message:
        payload?.message ||
        (res.status === 502 || res.status === 504
          ? 'The server is not responding. Is the backend running?'
          : `Request failed with status ${res.status}`),
      details: payload?.error?.details,
    });
  }
  return payload.data;
}

/**
 * Call the API and unwrap { success, data, message }.
 * On 401 from a protected endpoint, tries one silent session refresh and retries.
 */
export async function apiRequest(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    const isAuthPath = path.startsWith('/auth/');
    if (err instanceof ApiError && err.status === 401 && !isAuthPath && !opts._retried) {
      if (await refreshSession()) return rawRequest(path, { ...opts, _retried: true });
      listeners.forEach((fn) => fn());
    }
    throw err;
  }
}

export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
};

export const API_BASE_URL = BASE_URL;
