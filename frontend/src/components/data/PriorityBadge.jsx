import { ChevronDown, Minus, ChevronUp, ChevronsUp, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Priority band display. The band is computed by the backend engine; this component
 * never maps scores to bands itself, so there is only one band definition (backend config).
 * Shape + text carry the meaning; colour is reinforcement only.
 */
const BANDS = {
  LOW: { label: 'Low', icon: ChevronDown, cls: 'text-band-low border-band-low/40 bg-band-low/10' },
  MODERATE: { label: 'Moderate', icon: Minus, cls: 'text-band-moderate border-band-moderate/40 bg-band-moderate/10' },
  HIGH: { label: 'High', icon: ChevronUp, cls: 'text-band-high border-band-high/45 bg-band-high/10' },
  CRITICAL: { label: 'Critical', icon: ChevronsUp, cls: 'text-band-critical border-band-critical/50 bg-band-critical/10' },
};

export function PriorityBadge({ band, score, size = 'default', className }) {
  const cfg = BANDS[String(band || '').toUpperCase()];
  const Icon = cfg?.icon ?? CircleDashed;
  const label = cfg?.label ?? 'Not scored';
  const hasScore = typeof score === 'number' && Number.isFinite(score);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs',
        cfg?.cls ?? 'border-border text-muted-foreground',
        className
      )}
      aria-label={`Priority ${label}${hasScore ? `, score ${Math.round(score)} of 100` : ''}`}
    >
      <Icon className={size === 'lg' ? 'size-4' : 'size-3.5'} aria-hidden="true" />
      <span aria-hidden="true">
        {label}
        {hasScore && <span className="ml-1 font-mono opacity-80">{Math.round(score)}</span>}
      </span>
    </span>
  );
}

export const PRIORITY_BANDS = Object.keys(BANDS);
