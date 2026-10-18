import { FlaskConical } from 'lucide-react';
import { useI18n } from '@/app/i18n.jsx';
import { cn } from '@/lib/utils';

/** Conspicuous demo notice. Not dismissible: the pilot runs on synthetic data. */
export function DemoBanner({ className }) {
  const { t } = useI18n();
  return (
    <div
      role="note"
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-label-demo/40 bg-label-demo/10 px-4 py-2.5 text-sm',
        className
      )}
    >
      <span className="inline-flex items-center gap-2 font-semibold text-label-demo">
        <FlaskConical className="size-4" aria-hidden="true" />
        {t('demo.banner')}
      </span>
      <span className="text-muted-foreground">{t('demo.bannerDetail')}</span>
    </div>
  );
}
