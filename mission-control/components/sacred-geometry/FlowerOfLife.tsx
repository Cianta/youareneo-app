'use client';

interface Props {
  size?: number;
  className?: string;
  color?: string;
  opacity?: number;
}

// Flower of Life — 7 overlapping circles (1 center + 6 surrounding)
export function FlowerOfLife({ size = 120, className = '', color = '#2A6040', opacity = 0.4 }: Props) {
  const r = 30;
  const centers: [number, number][] = [
    [60, 60],
    [60 + r, 60],
    [60 - r, 60],
    [60 + r * Math.cos(Math.PI / 3), 60 - r * Math.sin(Math.PI / 3)],
    [60 - r * Math.cos(Math.PI / 3), 60 - r * Math.sin(Math.PI / 3)],
    [60 + r * Math.cos(Math.PI / 3), 60 + r * Math.sin(Math.PI / 3)],
    [60 - r * Math.cos(Math.PI / 3), 60 + r * Math.sin(Math.PI / 3)],
  ];

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="folCircle">
          <circle cx="60" cy="60" r="55" />
        </clipPath>
      </defs>
      <g clipPath="url(#folCircle)" opacity={opacity}>
        {centers.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx} cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
          />
        ))}
        {/* Outer bounding circle */}
        <circle cx="60" cy="60" r="55" fill="none" stroke={color} strokeWidth="0.8" opacity={0.4} />
      </g>
    </svg>
  );
}

// ── Tiled background component ─────────────────────────────────────────────────
export function FlowerBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="folPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            {/* Center circle */}
            <circle cx="30" cy="26" r="20" fill="none" stroke="#4F9E70" strokeWidth="0.5" />
            {/* 6 petals */}
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * Math.PI) / 3;
              // Round to 4 decimals — float serialization differs between server and
              // client renders, which triggers React hydration mismatches otherwise.
              const cx = +(30 + 20 * Math.cos(angle)).toFixed(4);
              const cy = +(26 + 20 * Math.sin(angle)).toFixed(4);
              return <circle key={i} cx={cx} cy={cy} r="20" fill="none" stroke="#4F9E70" strokeWidth="0.5" />;
            })}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#folPattern)" />
      </svg>
    </div>
  );
}
