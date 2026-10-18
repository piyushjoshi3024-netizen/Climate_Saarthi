import { Link } from 'react-router-dom';
import { Landmark, BadgeCheck, FlaskConical, Calculator } from 'lucide-react';
import { cn, formatIST } from '@/lib/utils';

/**
 * Provenance label. Every figure, record, chart and recommendation shows one.
 *  - official: source + issue time (+ validity for warnings)
 *  - curated:  checked by the team/moderator + last checked
 *  - demo:     synthetic record (is_demo: true)
 *  - modelled: engine/what-if output + version, links to /methodology
 */
export const LABELS = {
  official: { text: 'Official', icon: Landmark, cls: 'text-label-official border-label-official/40 bg-label-official/10' },
  curated: { text: 'Curated', icon: BadgeCheck, cls: 'text-label-curated border-label-curated/40 bg-label-curated/10' },
  demo: { text: 'Demo', icon: FlaskConical, cls: 'text-label-demo border-label-demo/45 bg-label-demo/10' },
  modelled: { text: 'Modelled', icon: Calculator, cls: 'text-label-modelled border-label-modelled/40 bg-label-modelled/10' },
};

export function DataLabel({
  kind,
  source,
  sourceUrl,
  timestamp,
  validUntil,
  checkedAt,
  version,
  showMeta = false,
  className,
}) {
  const key = String(kind || '').toLowerCase();
  const cfg = LABELS[key];
  if (!cfg) {
    // Fail visibly: an unlabelled figure is a bug, not something to hide.
    return (
      <span className={cn('font-mono text-xs text-destructive', className)}>Unlabelled data</span>
    );
  }
  const Icon = cfg.icon;

  const meta = [];
  if (key === 'official') {
    if (source) meta.push(source);
    if (timestamp) meta.push(`issued ${formatIST(timestamp)}`);
    if (validUntil) meta.push(`valid until ${formatIST(validUntil)}`);
  } else if (key === 'curated') {
    if (source) meta.push(source);
    if (checkedAt) meta.push(`last checked ${formatIST(checkedAt)}`);
  } else if (key === 'demo') {
    meta.push('Synthetic record, not real data');
  } else if (key === 'modelled') {
    if (version) meta.push(`engine ${version}`);
    if (timestamp) meta.push(`computed ${formatIST(timestamp)}`);
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em]',
          cfg.cls
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {cfg.text}
      </span>
      {showMeta && meta.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {sourceUrl && key === 'official' ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer noopener" className="underline hover:text-foreground">
              {meta.join(' · ')}
            </a>
          ) : (
            meta.join(' · ')
          )}
        </span>
      )}
      {key === 'modelled' && (
        <Link to="/methodology" className="inline-flex min-h-8 items-center text-xs text-label-modelled underline hover:text-foreground">
          How this is calculated
        </Link>
      )}
    </span>
  );
}
