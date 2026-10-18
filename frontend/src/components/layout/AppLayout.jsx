import { Link, Outlet, ScrollRestoration } from 'react-router-dom';
import { X } from 'lucide-react';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { PageTransition } from './PageTransition.jsx';
import { useI18n } from '@/app/i18n.jsx';
import { useAuth } from '@/app/auth.jsx';

function SessionNotice() {
  const { notice, clearNotice, status } = useAuth();
  const { t } = useI18n();
  if (notice !== 'expired' || status === 'authenticated') return null;
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
      <span className="flex-1 font-semibold">{t('session.expired')}</span>
      <Link to="/login" onClick={clearNotice} className="inline-flex min-h-10 items-center font-semibold text-accent underline">
        {t('nav.signIn')}
      </Link>
      <button type="button" onClick={clearNotice} aria-label="Dismiss" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-2">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AppLayout() {
  const { t } = useI18n();

  return (
    <>
      <a href="#main" className="skip-link">
        {t('skip.toMain')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pt-24 outline-none sm:px-6 sm:pt-28">
        <SessionNotice />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  );
}
