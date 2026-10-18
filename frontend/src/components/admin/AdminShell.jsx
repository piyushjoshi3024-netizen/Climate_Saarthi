import { NavLink } from 'react-router-dom';
import { PageHeader } from '@/components/data/PageHeader.jsx';
import { PhaseNotice } from '@/components/data/PhaseNotice.jsx';
import { useAuth } from '@/app/auth.jsx';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/queue', label: 'Queue' },
  { to: '/admin/verification', label: 'Verification' },
  { to: '/admin/signals', label: 'Signals' },
  { to: '/admin/localities', label: 'Localities' },
  { to: '/admin/resources', label: 'Resources' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/weights', label: 'Weights', adminOnly: true },
  { to: '/admin/audit', label: 'Audit', adminOnly: true },
];

/** Shared console frame. Only reachable once RequireAuth admits a COORDINATOR/ADMIN. */
export function AdminShell({ title, description, phase, items, children }) {
  const { user } = useAuth();
  const nav = ADMIN_NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
  return (
    <>
      <nav aria-label="Console" className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1">
          {nav.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold',
                    isActive ? 'bg-surface-2 text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <PageHeader eyebrow="Response console" title={title} description={description} />
      {children ?? <PhaseNotice phase={phase} items={items} />}
    </>
  );
}
