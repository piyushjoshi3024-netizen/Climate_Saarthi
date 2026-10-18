import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names (shadcn/ui convention). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format an ISO timestamp for display in India Standard Time. */
export function formatIST(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
    ...opts,
  }).format(d) + ' IST';
}
