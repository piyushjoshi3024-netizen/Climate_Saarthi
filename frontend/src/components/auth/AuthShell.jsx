import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Responsive frame for sign-in and registration pages. */
export function AuthShell({ eyebrow, title, description, children, footer, tone = 'default', wide = false }) {
  return (
    <div className={cn('mx-auto w-full py-2 sm:py-6', wide ? 'max-w-xl' : 'max-w-md')}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}

      <Card className={cn('mt-6 p-5 sm:mt-8 sm:p-7', tone === 'admin' && 'border-accent/30')}>{children}</Card>

      {footer && <div className="mt-6 space-y-2 text-sm text-muted-foreground">{footer}</div>}
      <p className="mt-4 text-sm text-muted-foreground">
        Just want to report an issue?{' '}
        <Link to="/report" className="inline-block py-1 font-semibold text-foreground underline">
          No account needed
        </Link>
      </p>
    </div>
  );
}
