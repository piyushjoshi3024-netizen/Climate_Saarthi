import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField, PasswordField, FormAlert, applyServerErrors, authErrorMessage } from '@/components/forms/Field.jsx';
import { loginSchema } from '@/lib/validation.js';
import { useAuth } from '@/app/auth.jsx';

/**
 * Shared sign-in form. `onSignedIn(user)` decides where to go next.
 * Errors stay generic so the form never reveals whether an email is registered.
 */
export function LoginForm({ submitLabel = 'Sign in', onSignedIn, emailAutoComplete = 'email' }) {
  const { login } = useAuth();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      onSignedIn?.(user);
    } catch (err) {
      applyServerErrors(err, setError, ['email', 'password']);
      setFormError(authErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={isSubmitting}>
      {formError && <FormAlert title="Couldn't sign you in">{formError}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete={emailAutoComplete}
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
        {isSubmitting ? 'Signing in…' : submitLabel}
      </Button>
    </form>
  );
}
