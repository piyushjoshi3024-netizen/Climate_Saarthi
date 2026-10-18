// Synthetic engine fixtures. Every record is is_demo: true and describes a fictional
// scenario, not a real locality, warning or resource. Factories return fresh objects.

export const NOW = '2026-05-20T06:00:00.000Z';

const iso = (offsetHours) => new Date(Date.parse(NOW) + offsetHours * 3_600_000).toISOString();
const daysAgo = (d) => iso(-24 * d);

export function heatSignal(overrides = {}) {
  return {
    id: 'sig-demo-1',
    hazardType: 'HEATWAVE',
    severity: 'HIGH',
    warningLevel: 'WARNING',
    trend: 'STABLE',
    source: 'Synthetic demo fixture (modelled on an IMD district warning format)',
    sourceUrl: 'https://mausam.imd.gov.in/responsive/districtWiseWarningGIS.php',
    sourceTimestamp: iso(-3),
    validUntil: iso(9),
    label: 'Demo',
    is_demo: true,
    ...overrides,
  };
}

function resource(overrides) {
  return {
    availability: 'AVAILABLE',
    status: 'OPERATIONAL',
    verificationStatus: 'VERIFIED',
    lastVerifiedAt: daysAgo(2),
    source: 'Synthetic demo fixture',
    is_demo: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------- Rohini (spec scenario)

export function rohiniScenario() {
  return {
    locality: {
      id: 'demo-rohini',
      name: 'Rohini, Delhi (demo scenario)',
      city: 'Delhi',
      population: 25000,
      vulnerablePopulation: 9000,
      exposureIndex: 0.6,
      centroid: { type: 'Point', coordinates: [77.1025, 28.7383] },
      contextSource: 'Synthetic demo fixture',
      is_demo: true,
    },
    signals: [heatSignal({ id: 'sig-rohini', severity: 'EXTREME', warningLevel: 'WARNING', trend: 'RISING' })],
    resources: [
      resource({
        id: 'res-rohini-water-01',
        name: 'Community Water Point 01 (demo)',
        type: 'WATER_POINT',
        unit: 'L/day',
        capacity: 8000,
        reliability: 0.75,
        accessibility: 0.65,
        verificationStatus: 'PENDING',
        lastVerifiedAt: null,
        location: { type: 'Point', coordinates: [77.1025, 28.7383] },
      }),
    ],
    criticalSites: [
      {
        id: 'site-rohini-hospital',
        name: 'Sector Hospital (demo)',
        type: 'HOSPITAL',
        location: { type: 'Point', coordinates: [77.1135, 28.7383] }, // ~1.07 km east of the water point
        is_demo: true,
      },
    ],
    reports: [
      { id: 'rep-rohini-1', type: 'WATER_POINT_DRY', status: 'OPEN', expiresAt: iso(48), is_demo: true },
      { id: 'rep-rohini-2', type: 'WATER_POINT_DRY', status: 'UNDER_REVIEW', expiresAt: iso(48), is_demo: true },
    ],
  };
}

// ---------------------------------------------------------------- A vs B (same warning)

const sharedContext = { city: 'Pilot City', population: 18000, vulnerablePopulation: 5400, exposureIndex: 0.55, is_demo: true };

export function localityA() {
  return {
    locality: { id: 'demo-ward-a', name: 'Ward A (demo)', ...sharedContext },
    signals: [heatSignal()],
    resources: [
      resource({ id: 'res-a-water-1', name: 'Ward A water point 1 (demo)', type: 'WATER_POINT', unit: 'L/day', capacity: 10000, reliability: 0.9, accessibility: 0.85 }),
      resource({ id: 'res-a-water-2', name: 'Ward A water point 2 (demo)', type: 'WATER_POINT', unit: 'L/day', capacity: 10000, reliability: 0.9, accessibility: 0.85 }),
      resource({ id: 'res-a-cool-1', name: 'Ward A cooling centre (demo)', type: 'COOLING_CENTRE', unit: 'persons/day', capacity: 600, reliability: 0.9, accessibility: 0.9 }),
      resource({ id: 'res-a-health-1', name: 'Ward A health post (demo)', type: 'HEALTH_FACILITY', unit: 'consults/day', capacity: 30, reliability: 0.9, accessibility: 0.8 }),
      resource({ id: 'res-a-vol-1', name: 'Ward A volunteer team (demo)', type: 'VOLUNTEER_TEAM', unit: 'check-ins/day', capacity: 1200, reliability: 0.8, accessibility: 0.9 }),
    ],
    criticalSites: [],
    reports: [],
  };
}

export function localityB() {
  return {
    locality: { id: 'demo-ward-b', name: 'Ward B (demo)', ...sharedContext },
    signals: [heatSignal()],
    resources: [
      resource({
        id: 'res-b-water-1',
        name: 'Ward B water point (demo, stale)',
        type: 'WATER_POINT',
        unit: 'L/day',
        capacity: 10000,
        reliability: 0.9,
        accessibility: 0.85,
        lastVerifiedAt: daysAgo(40),
      }),
      resource({
        id: 'res-b-vol-1',
        name: 'Ward B volunteer team (demo, pending)',
        type: 'VOLUNTEER_TEAM',
        unit: 'check-ins/day',
        capacity: 400,
        reliability: 0.8,
        accessibility: 0.9,
        verificationStatus: 'PENDING',
        lastVerifiedAt: null,
      }),
    ],
    criticalSites: [],
    reports: [{ id: 'rep-b-1', type: 'NO_SHADE', status: 'OPEN', expiresAt: iso(24), is_demo: true }],
  };
}

export const hoursFromNow = iso;
export { daysAgo };
