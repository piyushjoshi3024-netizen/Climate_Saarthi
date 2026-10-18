import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Small backend connectivity indicator (GET /api/v1/health). Text + dot, never colour alone. */
export function ApiStatus({ className }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => api.get('/health', { signal }),
    staleTime: 60_000,
    retry: false,
  });

  const state = isPending ? 'checking' : isError ? 'offline' : data?.status === 'ok' ? 'online' : 'offline';
  const text = {
    checking: 'API: checking…',
    online: 'API: connected',
    offline: 'API: not reachable',
  }[state];

  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-2 font-mono text-xs text-muted-foreground', className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 rounded-full',
          state === 'online' && 'bg-primary',
          state === 'offline' && 'bg-destructive',
          state === 'checking' && 'bg-muted-foreground'
        )}
      />
      {text}
    </span>
  );
}
