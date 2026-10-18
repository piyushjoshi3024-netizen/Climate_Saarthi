import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, UserRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth, ROLE_LABELS } from '@/app/auth.jsx';
import { useI18n } from '@/app/i18n.jsx';
import { cn } from '@/lib/utils';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/** Signed-in account button with a small disclosure menu (Escape and outside-click close it). */
export function AccountMenu({ className }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = useId();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const firstName = user.name.split(/\s+/)[0];

  const item =
    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface-2 focus-visible:bg-surface-2';

  return (
    <div className={cn('relative', className)}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${firstName}, ${t('nav.account')}`}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-input pl-1 pr-3 text-sm font-semibold hover:bg-surface-2"
      >
        <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 font-mono text-xs text-primary">
          {initials(user.name)}
        </span>
        <span className="max-w-[9rem] truncate">{firstName}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border bg-card p-2 shadow-[0_18px_50px_rgb(0_0_0/0.45)]"
        >
          <div className="px-3 pb-3 pt-2">
            <p className="truncate font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">
              {user.isStaff && <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />}
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <div className="border-t pt-2">
            <Link to={user.isStaff ? '/admin' : '/workspace'} className={item}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              {user.isStaff ? t('nav.console') : t('nav.workspace')}
            </Link>
            <Link to="/profile" className={item}>
              <UserRound className="size-4" aria-hidden="true" />
              {t('nav.profile')}
            </Link>
            <button
              type="button"
              className={cn(item, 'text-destructive')}
              onClick={async () => {
                setOpen(false);
                await logout();
                navigate('/', { replace: true });
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
