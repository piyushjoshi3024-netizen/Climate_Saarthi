/**
 * Original static illustration of the core idea: two neighbouring localities under the
 * same heat warning, with different support coverage. Purely illustrative (no data).
 * Also the basis for the Home static/WebGL fallback in a later phase.
 */
export function TwoLocalitiesIllustration({ className }) {
  const blocksA = [
    [40, 150, 26, 50], [74, 128, 22, 72], [104, 160, 30, 40], [140, 138, 24, 62], [70, 210, 34, 30],
  ];
  const blocksB = [
    [262, 142, 26, 58], [296, 160, 24, 40], [326, 124, 28, 76], [362, 152, 24, 48], [300, 214, 30, 28],
  ];
  return (
    <svg
      viewBox="0 0 440 300"
      role="img"
      aria-labelledby="illus-title illus-desc"
      className={className}
    >
      <title id="illus-title">Two localities, same warning, different support</title>
      <desc id="illus-desc">
        Locality A has two support points whose coverage rings overlap most homes. Locality B has one weak
        support point with a small ring, leaving most homes uncovered. Illustration only.
      </desc>
      <defs>
        <radialGradient id="haze" cx="50%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#ffb020" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffb020" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="440" height="300" rx="20" fill="var(--card)" />
      <rect width="440" height="300" rx="20" fill="url(#haze)" />
      <line x1="220" y1="40" x2="220" y2="270" stroke="var(--border)" strokeDasharray="4 6" />

      {/* Warning band shared by both */}
      <g fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.4">
        <rect x="140" y="18" width="160" height="22" rx="11" fill="#ffb020" fillOpacity="0.14" stroke="#ffb020" strokeOpacity="0.5" />
        <text x="220" y="33" textAnchor="middle" fill="#ffb020">SAME HEAT WARNING</text>
      </g>

      {/* Locality A: good coverage */}
      <circle cx="90" cy="175" r="78" fill="var(--primary)" fillOpacity="0.07" stroke="var(--primary)" strokeOpacity="0.45" />
      <circle cx="150" cy="190" r="56" fill="var(--primary)" fillOpacity="0.07" stroke="var(--primary)" strokeOpacity="0.35" />
      {blocksA.map(([x, y, w, h]) => (
        <rect key={`a${x}`} x={x} y={y} width={w} height={h} rx="3" fill="var(--surface-2)" stroke="var(--border)" />
      ))}
      <circle cx="90" cy="175" r="5" fill="var(--primary)" />
      <circle cx="150" cy="190" r="5" fill="var(--primary)" />

      {/* Locality B: gap */}
      <circle cx="340" cy="240" r="30" fill="var(--accent)" fillOpacity="0.06" stroke="var(--accent)" strokeOpacity="0.45" strokeDasharray="3 4" />
      {blocksB.map(([x, y, w, h]) => (
        <rect key={`b${x}`} x={x} y={y} width={w} height={h} rx="3" fill="var(--surface-2)" stroke="#ff6b5e" strokeOpacity="0.35" />
      ))}
      <circle cx="340" cy="240" r="5" fill="none" stroke="var(--accent)" strokeWidth="2" />

      <g fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.2" fill="var(--muted-foreground)">
        <text x="30" y="268" fill="var(--foreground)">LOCALITY A</text>
        <text x="30" y="283">SUPPORT NEARBY</text>
        <text x="410" y="268" textAnchor="end" fill="var(--foreground)">LOCALITY B</text>
        <text x="410" y="283" textAnchor="end">HELP MISSING</text>
      </g>
    </svg>
  );
}
