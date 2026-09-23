'use client';
import { useMemo } from 'react';

interface Props {
  size?: number;
  className?: string;
  animated?: boolean;
  opacity?: number;
}

// Metatron's Cube — 13 circle centers, all connected
function buildMetatron() {
  const r = 1;
  // Round to 4 decimals — float serialization differs between server and
  // client renders, which triggers React hydration mismatches otherwise.
  const rnd = (n: number) => +n.toFixed(4);
  const centers: [number, number][] = ([
    [0, 0], // C0 center
    // Inner ring (6 circles at distance r, 60° apart)
    [r, 0],
    [r * Math.cos(Math.PI / 3),  r * Math.sin(Math.PI / 3)],
    [r * Math.cos(2 * Math.PI / 3), r * Math.sin(2 * Math.PI / 3)],
    [-r, 0],
    [r * Math.cos(4 * Math.PI / 3), r * Math.sin(4 * Math.PI / 3)],
    [r * Math.cos(5 * Math.PI / 3), r * Math.sin(5 * Math.PI / 3)],
    // Outer ring (6 circles at distance 2r, offset 30°)
    [2 * r * Math.cos(Math.PI / 6),      2 * r * Math.sin(Math.PI / 6)],
    [2 * r * Math.cos(Math.PI / 2),      2 * r * Math.sin(Math.PI / 2)],
    [2 * r * Math.cos(5 * Math.PI / 6),  2 * r * Math.sin(5 * Math.PI / 6)],
    [2 * r * Math.cos(7 * Math.PI / 6),  2 * r * Math.sin(7 * Math.PI / 6)],
    [2 * r * Math.cos(3 * Math.PI / 2),  2 * r * Math.sin(3 * Math.PI / 2)],
    [2 * r * Math.cos(11 * Math.PI / 6), 2 * r * Math.sin(11 * Math.PI / 6)],
  ] as [number, number][]).map(([x, y]) => [rnd(x), rnd(y)] as [number, number]);

  const lines: Array<[[number, number], [number, number]]> = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      lines.push([centers[i], centers[j]]);
    }
  }

  return { centers, lines, r };
}

export function MetatronsCube({ size = 200, className = '', animated = true, opacity = 0.6 }: Props) {
  const { centers, lines, r } = useMemo(() => buildMetatron(), []);

  return (
    <svg
      viewBox="-3.2 -3.2 6.4 6.4"
      width={size}
      height={size}
      className={`${className} ${animated ? 'animate-sacred-rotate' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="mcGoldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#E2C97E" stopOpacity="0.8" />
          <stop offset="60%"  stopColor="#C9A84C" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#9A7A28" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mcGreenGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#68BC8C" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1B3D27" stopOpacity="0" />
        </radialGradient>
        <filter id="mcGlow">
          <feGaussianBlur stdDeviation="0.08" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="0" cy="0" r="2.5" fill="url(#mcGreenGrad)" opacity="0.3" />

      {/* All connection lines */}
      <g opacity={opacity * 0.35}>
        {lines.map(([a, b], i) => (
          <line
            key={`line-${i}`}
            x1={a[0]} y1={-a[1]}
            x2={b[0]} y2={-b[1]}
            stroke="#C9A84C"
            strokeWidth="0.018"
          />
        ))}
      </g>

      {/* Outer 6 circles */}
      {centers.slice(7).map(([cx, cy], i) => (
        <circle
          key={`outer-${i}`}
          cx={cx} cy={-cy}
          r={r}
          fill="none"
          stroke="#2A6040"
          strokeWidth="0.025"
          opacity={opacity * 0.5}
        />
      ))}

      {/* Inner 6 circles */}
      {centers.slice(1, 7).map(([cx, cy], i) => (
        <circle
          key={`inner-${i}`}
          cx={cx} cy={-cy}
          r={r}
          fill="none"
          stroke="#4F9E70"
          strokeWidth="0.03"
          opacity={opacity * 0.7}
          filter="url(#mcGlow)"
        />
      ))}

      {/* Center circle */}
      <circle
        cx="0" cy="0"
        r={r}
        fill="none"
        stroke="#68BC8C"
        strokeWidth="0.04"
        opacity={opacity}
        filter="url(#mcGlow)"
      />

      {/* Center dot */}
      <circle cx="0" cy="0" r="0.06" fill="#C9A84C" opacity={opacity} />

      {/* Circle center dots */}
      {centers.slice(1).map(([cx, cy], i) => (
        <circle
          key={`dot-${i}`}
          cx={cx} cy={-cy}
          r="0.04"
          fill="#C9A84C"
          opacity={opacity * 0.6}
        />
      ))}
    </svg>
  );
}

// ── Compact orb version for sidebars ──────────────────────────────────────────
export function MetatronsOrb({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ripple rings */}
      <div className="absolute inset-0 rounded-full border border-forest-600/30 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-1 rounded-full border border-gold/20" />
      <MetatronsCube size={size} animated={false} opacity={0.9} />
    </div>
  );
}
