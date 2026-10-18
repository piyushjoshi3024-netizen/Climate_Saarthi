import { PageHeader } from '@/components/data/PageHeader.jsx';
import { PhaseNotice } from '@/components/data/PhaseNotice.jsx';
import { EmergencyNotice } from '@/components/layout/Footer.jsx';

export default function Report() {
  return (
    <>
      <PageHeader
        eyebrow="Report a ground issue"
        title="Tell us where support is missing"
        description="For non-emergency issues such as a dry water point, a closed cooling centre or a listing that is out of date."
      />
      <EmergencyNotice className="mb-8" />
      <PhaseNotice
        phase={5}
        items={[
          'Locality (not a home address), report type and a short note',
          'Optional contact, visible only to authorised coordinators',
          'Consent and automatic expiry',
          'No medical or personal identity details accepted',
          'Reference code to track the report anonymously',
        ]}
      />
    </>
  );
}
