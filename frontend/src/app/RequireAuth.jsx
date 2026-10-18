import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { LoadingState, ErrorState } from '@/components/data/States.jsx';
import Forbidden from '@/pages/Forbidden.jsx';

/**
 * Route guard. Fails closed: content renders only for a signed-in user whose role is allowed.
 * This is UX only; the Express API enforces roles and locality scope server-side.
 */
export function RequireAuth({ roles = [], loginPath = '/login' }) {
  const { status, user, retry, error } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Checking your session" rows={2} className="max-w-2xl" />;

  if (status === 'unavailable' || status === 'error') {
    return (
      <ErrorState
        className="max-w-2xl"
        title="Sign-in is unavailable right now"
        error={
          status === 'unavailable'
            ? { message: 'The server is running but its database is not connected. Please try again shortly.', code: 'DATABASE_UNAVAILABLE' }
            : error
        }
        onRetry={retry}
      />
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to={loginPath} replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles.length && !roles.includes(user.role)) return <Forbidden />;

  return <Outlet />;
}
