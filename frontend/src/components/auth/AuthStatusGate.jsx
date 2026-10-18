import { LoadingState } from '@/components/data/States.jsx';
import { FormAlert } from '@/components/forms/Field.jsx';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth.jsx';

/**
 * Wraps a sign-in form: shows a loader while the session is checked, and an honest notice
 * when sign-in is unavailable (API down or database not connected) instead of a dead form.
 */
export function AuthStatusGate({ children }) {
  const { status, retry } = useAuth();
  if (status === 'loading') return <LoadingState label="Checking your session" rows={1} />;
  if (status === 'unavailable' || status === 'error') {
    return (
      <div className="space-y-4">
        <FormAlert title="Sign-in is unavailable right now">
          {status === 'unavailable'
            ? 'The server is running, but its database is not connected. Please try again shortly.'
            : 'The Climate Saarthi server could not be reached. Please check your connection and try again.'}
        </FormAlert>
        {import.meta.env.DEV && (
          <p className="rounded-xl border border-dashed p-3 font-mono text-xs text-muted-foreground">
            Developer hint: {status === 'unavailable' ? 'start MongoDB and check MONGODB_URI in backend/.env, or run the API with `npm run dev:memory`.' : 'start the API with `npm run dev` in backend/.'}
          </p>
        )}
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }
  return children;
}
