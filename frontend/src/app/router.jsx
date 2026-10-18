import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { RequireAuth } from '@/app/RequireAuth.jsx';
import { RouteError } from '@/pages/RouteError.jsx';
import { LoadingState } from '@/components/data/States.jsx';
import Home from '@/pages/Home.jsx';
import Forbidden from '@/pages/Forbidden.jsx';
import NotFound from '@/pages/NotFound.jsx';

// Every page except Home is code-split: phones download only the page they open.
const page = (load) => ({ lazy: async () => ({ Component: (await load()).default }) });

const USER_ROLES = ['CITIZEN', 'VOLUNTEER', 'ORGANIZATION', 'RESPONDER', 'COORDINATOR', 'ADMIN'];
const STAFF_ROLES = ['COORDINATOR', 'ADMIN'];
const RESPONSE_ROLES = ['RESPONDER', 'COORDINATOR', 'ADMIN'];

function PageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-28">
      <LoadingState label="Loading page" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    HydrateFallback: PageLoading,
    children: [
      { index: true, element: <Home /> },
      { path: 'dashboard', ...page(() => import('@/pages/Dashboard.jsx')) },
      { path: 'map', ...page(() => import('@/pages/Map.jsx')) },
      { path: 'locality/:id', ...page(() => import('@/pages/Locality.jsx')) },
      { path: 'resources', ...page(() => import('@/pages/Resources.jsx')) },
      { path: 'report', ...page(() => import('@/pages/Report.jsx')) },
      { path: 'track', ...page(() => import('@/pages/Track.jsx')) },
      { path: 'impact', ...page(() => import('@/pages/Impact.jsx')) },
      { path: 'methodology', ...page(() => import('@/pages/Methodology.jsx')) },
      { path: 'solutions', ...page(() => import('@/pages/Solutions.jsx')) },
      // Educational content lives on /solutions; no duplicate empty page.
      { path: 'learn', element: <Navigate to="/solutions" replace /> },
      { path: 'simulator', ...page(() => import('@/pages/Simulator.jsx')) },

      { path: 'login', ...page(() => import('@/pages/Login.jsx')) },
      { path: 'register', ...page(() => import('@/pages/Register.jsx')) },
      {
        element: <RequireAuth roles={USER_ROLES} />,
        children: [
          { path: 'workspace', ...page(() => import('@/pages/Workspace.jsx')) },
          { path: 'profile', ...page(() => import('@/pages/Profile.jsx')) },
          {
            element: <RequireAuth roles={RESPONSE_ROLES} />,
            children: [{ path: 'responses', ...page(() => import('@/pages/Responses.jsx')) }],
          },
        ],
      },

      { path: 'admin/login', ...page(() => import('@/pages/admin/Login.jsx')) },
      {
        path: 'admin',
        element: <RequireAuth roles={STAFF_ROLES} loginPath="/admin/login" />,
        children: [
          { index: true, ...page(() => import('@/pages/admin/Overview.jsx')) },
          { path: 'queue', ...page(() => import('@/pages/admin/Queue.jsx')) },
          { path: 'verification', ...page(() => import('@/pages/admin/Verification.jsx')) },
          { path: 'signals', ...page(() => import('@/pages/admin/Signals.jsx')) },
          { path: 'localities', ...page(() => import('@/pages/admin/Localities.jsx')) },
          { path: 'resources', ...page(() => import('@/pages/admin/Resources.jsx')) },
          { path: 'reports', ...page(() => import('@/pages/admin/Reports.jsx')) },
          {
            // Admin only (coordinators get 403 here and from the API).
            element: <RequireAuth roles={['ADMIN']} loginPath="/admin/login" />,
            children: [
              { path: 'weights', ...page(() => import('@/pages/admin/Weights.jsx')) },
              { path: 'audit', ...page(() => import('@/pages/admin/Audit.jsx')) },
            ],
          },
        ],
      },

      { path: '403', element: <Forbidden /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
