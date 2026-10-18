import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone, BadgeCheck, Droplets, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/auth.jsx';
import img480 from '@/assets/images/community-volunteers-480.webp';
import img765 from '@/assets/images/community-volunteers-765.webp';
import img765jpg from '@/assets/images/community-volunteers-765.jpg';

const STEPS = [
  { icon: BadgeCheck, title: 'Verify a listing', body: 'Check that a water point or cooling space is really open, and record evidence.' },
  { icon: Droplets, title: 'Report what is missing', body: 'A dry tap or a locked shelter becomes a gap the coordinators can see.' },
  { icon: HeartHandshake, title: 'Support approved actions', body: 'Help with check-ins and set-up once a coordinator approves the action.' },
];

/**
 * Bottom-of-dashboard section about the people who close response gaps.
 * The photo is illustrative and labelled as such; it is not presented as platform impact.
 */
export function CommunitySection() {
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated';

  return (
    <section aria-labelledby="community-heading" className="mt-16 overflow-hidden rounded-[var(--radius)] border bg-card">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* On desktop the photo fills the column height set by the text; on phones it sits above. */}
        <figure className="relative lg:min-h-[30rem]">
          <picture>
            <source type="image/webp" srcSet={`${img480} 480w, ${img765} 765w`} sizes="(min-width: 1024px) 460px, 100vw" />
            <img
              src={img765jpg}
              width={765}
              height={1024}
              loading="lazy"
              decoding="async"
              alt="Volunteers in a community garden: two people plant a sapling while others take notes and photograph the work."
              className="aspect-[4/3] w-full object-cover object-[50%_65%] sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
            />
          </picture>
          <figcaption className="border-b px-4 py-2 text-xs text-muted-foreground lg:absolute lg:bottom-3 lg:left-3 lg:right-3 lg:rounded-full lg:border-0 lg:bg-background/80 lg:px-3 lg:py-1.5 lg:text-center lg:backdrop-blur">
            Illustrative photo · not a record of a Climate Saarthi activity
          </figcaption>
        </figure>

        <div className="flex flex-col justify-center gap-6 p-6 sm:p-8 lg:p-10">
          <div>
            <p className="eyebrow">On the ground</p>
            <h2 id="community-heading" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
              Gaps close when people check, report and help.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Volunteers and local organisations confirm which water points and cooling spaces actually work. Coordinators
              approve the actions. Verified evidence then updates the modelled coverage and priority.
            </p>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex items-start gap-3 rounded-2xl border bg-background/60 p-4 sm:flex-col lg:flex-row">
                <div className="flex shrink-0 items-center gap-2 lg:pt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {signedIn ? (
              <Button as={Link} to={user.isStaff ? '/admin' : '/workspace'} size="lg">
                {user.isStaff ? 'Open the console' : 'Go to your workspace'}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button as={Link} to="/register?role=VOLUNTEER" size="lg">
                Join as a volunteer
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
            <Button as={Link} to="/report" variant="outline" size="lg">
              <Megaphone aria-hidden="true" />
              Report a ground issue
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
