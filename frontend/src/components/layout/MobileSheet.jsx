import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { X, Megaphone, LogIn, LogOut, Languages, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo.jsx';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav-items.js';
import { useI18n } from '@/app/i18n.jsx';
import { useAuth, ROLE_LABELS } from '@/app/auth.jsx';
import { cn } from '@/lib/utils';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen menu (below 1280px): modal dialog, focus trap, Escape to close,
 * body scroll lock, focus returned to the trigger on close.
 */
export function MobileSheet({ open, onClose, returnFocusRef }) {
  const { t, toggle } = useI18n();
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const returnTo = returnFocusRef?.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Close automatically if the viewport grows past the breakpoint.
    const mq = window.matchMedia('(min-width: 1280px)');
    const onMq = (e) => e.matches && onClose();
    mq.addEventListener('change', onMq);

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.body.style.overflow = overflow;
      returnTo?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  const linkCls = ({ isActive }) =>
    cn(
      'block rounded-2xl px-4 py-2.5 text-xl font-bold tracking-tight transition-colors sm:text-2xl',
      isActive ? 'bg-surface-2 text-primary' : 'text-foreground hover:bg-surface-2'
    );

  const signedIn = status === 'authenticated';

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav.primary')}
      className="page-enter fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-background px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4"
    >
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Logo onClick={onClose} />
          <Button variant="outline" size="icon" onClick={onClose} aria-label={t('nav.close')}>
            <X aria-hidden="true" />
          </Button>
        </div>

        {signedIn && (
          <div className="mt-6 rounded-2xl border bg-card p-4">
            <p className="truncate font-bold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email} · {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
        )}

        <nav aria-label={t('nav.primary')} className="mt-6 flex flex-col gap-0.5">
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
            <NavLink key={item.to} to={item.to} className={linkCls} onClick={onClose}>
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button as={Link} to="/report" variant="accent" size="lg" onClick={onClose}>
            <Megaphone aria-hidden="true" />
            {t('nav.report')}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            {signedIn ? (
              <Button as={Link} to={user.isStaff ? '/admin' : '/workspace'} variant="outline" onClick={onClose}>
                <LayoutDashboard aria-hidden="true" />
                {user.isStaff ? t('nav.console') : t('nav.workspace')}
              </Button>
            ) : (
              <Button as={Link} to="/login" variant="outline" onClick={onClose}>
                <LogIn aria-hidden="true" />
                {t('nav.signIn')}
              </Button>
            )}
            <Button variant="outline" onClick={toggle} aria-label={t('lang.switchLabel')}>
              <Languages aria-hidden="true" />
              {t('lang.switchTo')}
            </Button>
          </div>
          {signedIn && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={async () => {
                onClose();
                await logout();
                navigate('/', { replace: true });
              }}
            >
              <LogOut aria-hidden="true" />
              {t('nav.signOut')}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
