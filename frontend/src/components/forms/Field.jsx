import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputClass =
  'h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 aria-[invalid=true]:border-destructive sm:text-sm';

/** Labelled text input with hint and error wired to aria-describedby. Works with RHF register(). */
export const TextField = forwardRef(function TextField({ label, hint, error, className, id: idProp, ...props }, ref) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        className={inputClass}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

/** Password input with an accessible show/hide toggle. */
export const PasswordField = forwardRef(function PasswordField({ label, hint, error, className, ...props }, ref) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
          className={cn(inputClass, 'pr-14')}
          spellCheck={false}
          autoCapitalize="none"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-1 my-auto inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

/** Form-level alert. tone: error | info | success */
export function FormAlert({ tone = 'error', title, children, className }) {
  const styles = {
    error: 'border-destructive/40 bg-destructive/10',
    info: 'border-accent/40 bg-accent/10',
    success: 'border-primary/40 bg-primary/10',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm', styles, className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-1', 'text-muted-foreground')}>{children}</div>}
    </div>
  );
}

/** Copy server-side field errors (400 VALIDATION_ERROR) into React Hook Form. */
export function applyServerErrors(err, setError, fields) {
  const serverFields = err?.details?.fields ?? {};
  let applied = false;
  for (const name of fields) {
    if (serverFields[name]) {
      setError(name, { type: 'server', message: serverFields[name] });
      applied = true;
    }
  }
  return applied;
}

/** User-facing message for an auth API error. Login errors stay generic on purpose. */
export function authErrorMessage(err) {
  switch (err?.code) {
    case 'INVALID_CREDENTIALS':
      return 'Email or password is incorrect.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'DATABASE_UNAVAILABLE':
      return 'Sign-in is temporarily unavailable because the database is not connected. Please try again shortly.';
    case 'NETWORK_ERROR':
      return err.message;
    case 'EMAIL_IN_USE':
      return 'An account with this email already exists. Try signing in instead.';
    case 'ROLE_NOT_ALLOWED':
      return 'That account type can only be created by an admin.';
    case 'VALIDATION_ERROR':
      return 'Please check the highlighted fields.';
    default:
      return err?.status >= 500 || err?.status === 0
        ? 'Something went wrong on our side. Please try again.'
        : err?.message || 'Something went wrong. Please try again.';
  }
}
