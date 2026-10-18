import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('skeleton-shimmer rounded-md', className)} {...props} />;
}
