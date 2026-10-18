import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <header className={cn('flex flex-col gap-4 pb-8 pt-4 sm:pb-10', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl">
        {title}
      </h1>
      {description && <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{description}</p>}
      {children}
      {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
    </header>
  );
}
