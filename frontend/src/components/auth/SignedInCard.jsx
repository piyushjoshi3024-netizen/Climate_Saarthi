import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, homeFor, ROLE_LABELS } from '@/app/auth.jsx';

/** Shown on sign-in pages when the visitor is already signed in. */
export function SignedInCard() {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-3">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          You're signed in as <strong className="break-all">{user.email}</strong> ({ROLE_LABELS[user.role] ?? user.role}).
        </span>
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to={homeFor(user)} className="sm:flex-1">
          {user.isStaff ? 'Open console' : 'Go to workspace'}
        </Button>
        <Button variant="outline" onClick={logout} className="sm:flex-1">
          Sign out
        </Button>
      </div>
    </div>
  );
}
