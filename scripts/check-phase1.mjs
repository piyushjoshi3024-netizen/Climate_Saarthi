#!/usr/bin/env node
// Phase 1 guardrail checks. Run from the repo root: `node scripts/check-phase1.mjs`
// Exits non-zero on any failure.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const check = (name, pass, detail = '') => results.push({ name, pass: Boolean(pass), detail });

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(root);
const rel = (p) => p.slice(root.length + 1);

// 1. JavaScript only
const tsFiles = files.filter((f) => ['.ts', '.tsx', '.mts', '.cts'].includes(extname(f)) || f.endsWith('tsconfig.json'));
check('No TypeScript files or tsconfig', tsFiles.length === 0, tsFiles.map(rel).join(', '));

// 2. No animation / 3D / TypeScript packages yet
const FORBIDDEN_PKGS = [
  'typescript', 'motion', 'framer-motion', 'gsap', 'lenis', '@studio-freight/lenis', 'swiper',
  'three', '@react-three/fiber', '@react-three/drei',
];
for (const app of ['frontend', 'backend']) {
  const pkg = JSON.parse(readFileSync(join(root, app, 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const found = FORBIDDEN_PKGS.filter((p) => p in deps);
  check(`${app}: no animation/3D/TS packages in Phase 1`, found.length === 0, found.join(', '));
}

// 3. Exactly four solution cards, in the required order; only heatwave is live
const { SOLUTIONS } = await import(pathToFileURL(join(root, 'frontend/src/data/solutions.js')).href);
const expected = [
  ['heatwave', 'Heatwaves / urban heat', 'Heat Exposure Planner', 'mvp'],
  ['floods', 'Floods', 'FloodReady India', 'concept'],
  ['air', 'Air pollution', 'CleanAir Connect', 'concept'],
  ['drought', 'Drought and water stress', 'JalSanjivani', 'concept'],
];
check('Exactly four solution cards', SOLUTIONS.length === 4, `found ${SOLUTIONS.length}`);
expected.forEach(([id, aspect, name, status], i) => {
  const s = SOLUTIONS[i] || {};
  check(
    `Card ${i + 1}: ${aspect} — ${name} (${status})`,
    s.id === id && s.aspect === aspect && s.name === name && s.status === status && s.order === i + 1,
    JSON.stringify({ id: s.id, aspect: s.aspect, name: s.name, status: s.status })
  );
});
const signatures = SOLUTIONS.map((s) => s.signatureFeature);
check(
  'Signature features match spec',
  JSON.stringify(signatures) ===
    JSON.stringify(['Heat Exposure Planner', 'Flood Impact Reporter', 'Pollution Exposure Comparator', 'Water Stress Timeline']),
  signatures.join(' | ')
);

// 4. None of the other 14 aspects appear as UI content
const OTHER_ASPECTS = [
  'Climate-resilient farming', 'Food surplus', 'Food waste', 'Solid waste', 'Plastics',
  'Renewable energy', 'Energy efficiency', 'Sustainable transport', 'Biodiversity',
  'Low-income climate vulnerability', 'Rural resilience', 'Green jobs', 'Water quality',
  'Disaster readiness', 'Climate education', 'PM-KUSUM', 'Mission LiFE', 'MGNREGA',
];
const uiFiles = files.filter((f) => f.includes(`${join('frontend', 'src')}`) && /\.(jsx?|css)$/.test(f));
const hits = [];
for (const f of uiFiles) {
  const text = readFileSync(f, 'utf8').toLowerCase();
  for (const a of OTHER_ASPECTS) if (text.includes(a.toLowerCase())) hits.push(`${rel(f)}: ${a}`);
}
check('No other climate aspects in the UI source', hits.length === 0, hits.join('; '));

// 5. Emergency disclaimer present (exact wording)
const DISCLAIMER = 'In an emergency call 112 (ambulance 108). Climate Saarthi is not an emergency service.';
const en = readFileSync(join(root, 'frontend/src/lib/i18n/en.js'), 'utf8');
check('Emergency disclaimer text present', en.includes(DISCLAIMER));
const report = readFileSync(join(root, 'frontend/src/pages/Report.jsx'), 'utf8');
check('Report page renders the emergency notice', report.includes('<EmergencyNotice'));

// 6. Client env has no secrets
const feEnv = readFileSync(join(root, 'frontend/.env.example'), 'utf8')
  .split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#'));
check(
  'Frontend .env.example holds only public VITE_* URLs',
  feEnv.every((l) => l.startsWith('VITE_') && !/SECRET|MONGO|KEY|TOKEN|PASSWORD/i.test(l)),
  feEnv.join(', ')
);

// 7. .env files are git-ignored
const gi = existsSync(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : '';
check('.env is git-ignored', /^\.env$/m.test(gi) || /^\*\*\/\.env$/m.test(gi), '');

// Report
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${!r.pass && r.detail ? `\n      ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
