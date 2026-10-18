import { cn } from '@/lib/utils';

export function Card({ className, as: Comp = 'div', ...props }) {
  return (
    <Comp
      className={cn('rounded-[var(--radius)] border bg-card text-card-foreground', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-2 p-6 pb-3', className)} {...props} />;
}

export function CardTitle({ className, as: Comp = 'h3', ...props }) {
  return <Comp className={cn('text-lg font-bold leading-snug tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-3', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props} />;
}
