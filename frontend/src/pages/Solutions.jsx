import { ExternalLink, CircleCheck, Lightbulb, Target, Users, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/data/PageHeader.jsx';
import { DataLabel } from '@/components/data/DataLabel.jsx';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SOLUTIONS, SOLUTION_STATUS } from '@/data/solutions.js';

function Section({ icon: Icon, title, children }) {
  return (
    <div>
      <h4 className="eyebrow flex items-center gap-2">
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </h4>
      <div className="mt-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

export default function Solutions() {
  return (
    <>
      <PageHeader
        eyebrow="Climate solutions"
        title="Four climate aspects, one live engine."
        description="Heatwaves are connected to the Response Intelligence Engine in this pilot. Floods, air pollution and drought are informational solution concepts: no engines, forecasts or live data feeds are built for them."
      />

      <ol className="grid gap-6">
        {SOLUTIONS.map((s) => {
          const status = SOLUTION_STATUS[s.status];
          return (
            <li key={s.id}>
              <Card as="article" aria-labelledby={`sol-${s.id}`} className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="eyebrow mr-1">0{s.order}</span>
                  <Badge variant={s.status === 'mvp' ? 'primary' : 'muted'}>{status.label}</Badge>
                  <DataLabel kind="curated" />
                </div>
                <h2 id={`sol-${s.id}`} className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {s.aspect}
                </h2>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {s.name}
                  {s.signatureFeature !== s.name && (
                    <span className="text-muted-foreground"> · signature feature: {s.signatureFeature}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{status.detail}</p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Section icon={TriangleAlert} title="Problem">
                    <p>{s.problem}</p>
                  </Section>
                  <Section icon={Users} title="Who is affected">
                    <p>{s.affected}</p>
                  </Section>
                  <Section icon={Lightbulb} title="Practical solution">
                    <ul className="space-y-1.5">
                      {s.solution.map((line) => (
                        <li key={line} className="flex gap-2">
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary/80" aria-hidden="true" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    {s.caution && <p className="mt-3 text-muted-foreground">Note: {s.caution}</p>}
                  </Section>
                  <div className="space-y-6">
                    <Section icon={Target} title="Success metric">
                      <p>{s.successMetric}</p>
                    </Section>
                    <Section icon={ExternalLink} title="Official references">
                      <ul className="space-y-0.5">
                        {s.sources.map((src) => (
                          <li key={src.url}>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex min-h-9 items-center gap-1.5 underline decoration-border hover:decoration-foreground"
                            >
                              {src.name}
                              <ExternalLink className="size-3" aria-hidden="true" />
                              <span className="sr-only">(opens in a new tab)</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </>
  );
}
