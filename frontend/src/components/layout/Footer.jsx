import { Link } from 'react-router-dom';
import { Phone, ExternalLink } from 'lucide-react';
import { Logo } from './Logo.jsx';
import { ApiStatus } from './ApiStatus.jsx';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav-items.js';
import { SOLUTIONS } from '@/data/solutions.js';
import { useI18n } from '@/app/i18n.jsx';

// Unique official references across the four aspects, in card order.
const OFFICIAL_SOURCES = SOLUTIONS.flatMap((s) => s.sources).filter(
  (src, i, all) => all.findIndex((x) => x.url === src.url) === i
);

export function EmergencyNotice({ className = '' }) {
  const { t } = useI18n();
  return (
    <p
      role="note"
      className={`flex items-start gap-2.5 rounded-2xl border border-band-critical/40 bg-band-critical/10 px-4 py-3 text-sm font-semibold text-foreground ${className}`}
    >
      <Phone className="mt-0.5 size-4 shrink-0 text-band-critical" aria-hidden="true" />
      <span>{t('footer.emergency')}</span>
    </p>
  );
}

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-24 border-t bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <EmergencyNotice />

        <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr_1.4fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{t('footer.tagline')}</p>
            <ApiStatus />
          </div>

          <nav aria-label={t('footer.product')}>
            <h2 className="eyebrow mb-3">{t('footer.product')}</h2>
            <ul className="space-y-0.5 text-sm">
              {[...PRIMARY_NAV, ...SECONDARY_NAV, { to: '/report', key: 'nav.report' }].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="inline-flex min-h-9 items-center text-muted-foreground hover:text-foreground">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-3">{t('footer.sources')}</h2>
            <ul className="space-y-0.5 text-sm">
              {OFFICIAL_SOURCES.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-9 items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {src.name}
                    <ExternalLink className="size-3" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{t('footer.sourceNote')}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>Climate Saarthi · decision support, not a forecast or an emergency service.</p>
          <Link to="/methodology" className="inline-flex min-h-9 items-center hover:text-foreground">
            Methodology & limitations
          </Link>
        </div>
      </div>
    </footer>
  );
}
