import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Megaphone, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo.jsx';
import { MobileSheet } from './MobileSheet.jsx';
import { AccountMenu } from './AccountMenu.jsx';
import { PRIMARY_NAV } from './nav-items.js';
import { useI18n } from '@/app/i18n.jsx';
import { useAuth } from '@/app/auth.jsx';
import { cn } from '@/lib/utils';

/**
 * Floating pill navbar. Glass effect with a plain fallback (see .glass-pill).
 * Full link row from 1280px (xl); below that, a menu button opens the full-screen sheet.
 * Compacts after scrolling. Motion `layoutId` animation arrives in Phase 7.
 */
export function Navbar() {
  const { t, toggle } = useI18n();
  const { status } = useAuth();
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const signedIn = status === 'authenticated';

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setCompact(window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const linkCls = ({ isActive }) =>
    cn(
      'rounded-full px-3 py-2 text-sm font-semibold transition-colors',
      isActive ? 'bg-surface-2 text-foreground' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4">
        <div
          className={cn(
            'glass-pill pointer-events-auto mt-3 flex w-full max-w-6xl items-center justify-between gap-2 rounded-full transition-[padding,box-shadow] duration-200',
            compact ? 'py-1.5 pl-3 pr-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.35)] sm:pl-4' : 'py-2 pl-3 pr-2 sm:pl-5'
          )}
        >
          <Logo />

          <nav aria-label={t('nav.primary')} className="hidden items-center xl:flex">
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkCls}>
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              aria-label={t('lang.switchLabel')}
              className="hidden h-10 px-3 md:inline-flex"
            >
              <Languages aria-hidden="true" />
              {t('lang.switchTo')}
            </Button>
            <Button as={Link} to="/report" variant="accent" size="sm" className="hidden h-10 sm:inline-flex">
              <Megaphone aria-hidden="true" />
              {t('nav.report')}
            </Button>
            {signedIn ? (
              <AccountMenu className="hidden md:block" />
            ) : (
              <Button as={Link} to="/login" variant="ghost" size="sm" className="hidden h-10 md:inline-flex">
                {t('nav.signIn')}
              </Button>
            )}
            <Button
              ref={menuBtnRef}
              variant="outline"
              size="icon"
              className="size-10 xl:hidden"
              aria-label={t('nav.menu')}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>
      <MobileSheet open={menuOpen} onClose={closeMenu} returnFocusRef={menuBtnRef} />
    </>
  );
}
