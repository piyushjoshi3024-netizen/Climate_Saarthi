import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Original mark: a coverage ring with a gap (amber) around a support point (green). */
export function Logo({ className, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Climate Saarthi home"
      className={cn('inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-full pr-1', className)}
    >
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="11"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="50 19"
          transform="rotate(-90 16 16)"
        />
        <circle cx="16" cy="16" r="4.2" fill="var(--primary)" />
      </svg>
      <span className="whitespace-nowrap text-[0.95rem] font-extrabold tracking-tight">
        Climate <span className="text-primary">Saarthi</span>
      </span>
    </Link>
  );
}
