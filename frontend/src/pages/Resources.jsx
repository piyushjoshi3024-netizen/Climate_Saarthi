import { PageHeader } from '@/components/data/PageHeader.jsx';
import { PhaseNotice } from '@/components/data/PhaseNotice.jsx';

export default function Resources() {
  return (
    <>
      <PageHeader
        eyebrow="Resource directory"
        title="Water points, cooling centres and support"
        description="Each listing shows capacity, reliability, accessibility, source and when it was last verified."
      />
      <PhaseNotice
        phase={6}
        items={[
          'Search and filter by type, locality, status and verification',
          'Capacity with units, reliability and accessibility',
          'Source label and last-verified date on every listing',
          '"Report outdated" action that feeds the review queue',
        ]}
      />
    </>
  );
}
