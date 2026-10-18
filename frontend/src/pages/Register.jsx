import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell.jsx';
import { SignedInCard } from '@/components/auth/SignedInCard.jsx';
import { AuthStatusGate } from '@/components/auth/AuthStatusGate.jsx';
import { TextField, PasswordField, FormAlert, applyServerErrors, authErrorMessage } from '@/components/forms/Field.jsx';
import { Button } from '@/components/ui/button';
import { registerSchema, PUBLIC_ROLE_OPTIONS, PASSWORD_MIN } from '@/lib/validation.js';
import { useAuth, homeFor } from '@/app/auth.jsx';
import { cn } from '@/lib/utils';

export default function Register() {
  const { status, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState(null);

  const requested = params.get('role')?.toUpperCase();
  const initialRole = PUBLIC_ROLE_OPTIONS.some((r) => r.value === requested) ? requested : 'CITIZEN';

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: initialRole },
  });
  const role = watch('role');

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await createAccount(values);
      navigate(homeFor(user), { replace: true });
    } catch (err) {
      applyServerErrors(err, setError, ['name', 'email', 'password', 'role']);
      setFormError(authErrorMessage(err));
    }
  });

  return (
    <AuthShell
      wide
      eyebrow="Create account"
      title="Join Climate Saarthi"
      description="Responder, coordinator and admin accounts are created by an admin, not through this form."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="inline-block py-1 font-semibold text-foreground underline">
            Sign in
          </Link>
        </p>
      }
    >
      <AuthStatusGate>
        {status === 'authenticated' ? (
          <SignedInCard />
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={isSubmitting}>
            {formError && <FormAlert title="Couldn't create your account">{formError}</FormAlert>}

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">I'm joining as</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {PUBLIC_ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 sm:flex-col sm:gap-2',
                      role === opt.value ? 'border-primary bg-primary/10' : 'hover:bg-surface-2'
                    )}
                  >
                    <input type="radio" value={opt.value} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" {...register('role')} />
                    <span>
                      <span className="block text-sm font-bold">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.role && <p className="mt-1.5 text-xs font-medium text-destructive">{errors.role.message}</p>}
            </fieldset>

            <TextField label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              error={errors.email?.message}
              {...register('email')}
            />
            <PasswordField
              label="Password"
              autoComplete="new-password"
              hint={`At least ${PASSWORD_MIN} characters. A short phrase works well.`}
              error={errors.password?.message}
              {...register('password')}
            />

            <p className="text-xs text-muted-foreground">
              We only store your name, email and account type. Don't add medical or personal identity details anywhere
              in Climate Saarthi.
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        )}
      </AuthStatusGate>
    </AuthShell>
  );
}
