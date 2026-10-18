import { Inbox, TriangleAlert, RotateCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/app/i18n.jsx';

/** Loading skeleton with an accessible status message. */
export function LoadingState({ label, rows = 3, className }) {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" className={cn('space-y-3', className)}>
      <span className="sr-only">{label || t('common.loading')}…</span>
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-[var(--radius)]" />
      ))}
    </div>
  );
}

/** Empty state. Say why it is empty and what to do next. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius)] border border-dashed bg-card/40 p-6 sm:p-8',
        className
      )}
    >
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="max-w-prose text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

/** Error state with retry. Shows the API error code for support/debugging. */
export function ErrorState({ title = 'Something went wrong', error, onRetry, className }) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive/5 p-6',
        className
      )}
    >
      <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
      <h3 className="text-base font-bold">{title}</h3>
      {error?.message && <p className="max-w-prose text-sm text-muted-foreground">{error.message}</p>}
      {error?.code && <p className="font-mono text-xs text-muted-foreground">Code: {error.code}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
