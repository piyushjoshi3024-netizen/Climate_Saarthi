import { Construction } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Honest placeholder for a route shell: says which phase fills it and what will appear.
 * Shells never show invented numbers.
 */
export function PhaseNotice({ phase, items = [], note, className }) {
  return (
    <section
      aria-label={`Planned for phase ${phase}`}
      className={cn('rounded-[var(--radius)] border bg-card p-6 sm:p-8', className)}
    >
      <div className="flex items-center gap-2">
        <Construction className="size-5 text-accent" aria-hidden="true" />
        <p className="eyebrow !text-accent">Route shell · built in phase {phase}</p>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-4 text-sm text-muted-foreground">{note}</p>}
    </section>
  );
}
