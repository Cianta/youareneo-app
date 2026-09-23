'use client';

/**
 * TrinityLogo — Animated yin-yang mark for YOU ARE NEO / TRINITY OS.
 *
 * High-end choreography, one master cycle (20 s):
 *   0–35 %   REST — blue/green yin-yang with purple centre drop, perfectly still
 *  35–55 %   SPIRAL COLLAPSE — the two drops spin up (2 revolutions) and spiral
 *            into the centre, shrinking to a medium indigo/dark-turquoise dot
 *  55–70 %   GOLDEN REBIRTH — golden light blooms, the logo grows back to full
 *            size (slight overshoot) while completing a third revolution
 *  70–82 %   SILVER SHIMMER — a silver gloss sweeps across, tiny sparkles glint
 *  82–100 %  REST again → seamless restart
 *
 * Total stillness per cycle ≈ 6.4 s ("länger stillstehen").
 * Respects prefers-reduced-motion (static logo).
 */

interface Props {
  size?: number;
  className?: string;
}

export function TrinityLogo({ size = 36, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label="TRINITY OS — YOU ARE NEO"
    >
      <defs>
        {/* ── Green (yang) gradient ── */}
        <radialGradient id="tl-yang" gradientUnits="userSpaceOnUse" cx="63" cy="26" r="46">
          <stop offset="0%"   stopColor="#d8f4a8" />
          <stop offset="26%"  stopColor="#6bbf40" />
          <stop offset="62%"  stopColor="#4a8a3f" />
          <stop offset="100%" stopColor="#2a5228" />
        </radialGradient>

        {/* ── Blue (yin) gradient ── */}
        <radialGradient id="tl-yin" gradientUnits="userSpaceOnUse" cx="37" cy="74" r="46">
          <stop offset="0%"   stopColor="#8aabf5" />
          <stop offset="28%"  stopColor="#3355cc" />
          <stop offset="65%"  stopColor="#1e3ba8" />
          <stop offset="100%" stopColor="#0b1840" />
        </radialGradient>

        {/* ── Yang eye (blue on green half) ── */}
        <radialGradient id="tl-yang-eye" cx="45%" cy="33%" r="60%">
          <stop offset="0%"   stopColor="#e8f0ff" />
          <stop offset="38%"  stopColor="#5588ff" />
          <stop offset="100%" stopColor="#1530a8" />
        </radialGradient>

        {/* ── Yin dot (green on blue half) ── */}
        <radialGradient id="tl-yin-dot" cx="40%" cy="33%" r="65%">
          <stop offset="0%"   stopColor="#eeffcc" />
          <stop offset="36%"  stopColor="#7acc44" />
          <stop offset="100%" stopColor="#2a5228" />
        </radialGradient>

        {/* ── Purple centre drop (rest state) ── */}
        <radialGradient id="tl-purple" cx="50%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="18%"  stopColor="#ede9fe" />
          <stop offset="52%"  stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b0764" stopOpacity="0.65" />
        </radialGradient>

        {/* ── Indigo → dark-turquoise collapse dot ── */}
        <radialGradient id="tl-collapse" cx="42%" cy="36%" r="70%">
          <stop offset="0%"   stopColor="#a5f3fc" />
          <stop offset="30%"  stopColor="#22d3ee" />
          <stop offset="60%"  stopColor="#155e75" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>

        {/* ── Golden light bloom ── */}
        <radialGradient id="tl-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff7d6" />
          <stop offset="30%"  stopColor="#fcd34d" stopOpacity="0.9" />
          <stop offset="65%"  stopColor="#f59e0b" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </radialGradient>

        {/* ── Silver gloss sweep ── */}
        <linearGradient id="tl-silver" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
          <stop offset="42%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%"  stopColor="#f8fafc" stopOpacity="0.85" />
          <stop offset="58%"  stopColor="#cbd5e1" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Clip for the shimmer sweep — stays inside the orb */}
        <clipPath id="tl-clip">
          <circle cx="50" cy="50" r="47" />
        </clipPath>

        {/* ── Soft glow filter ── */}
        <filter id="tl-glow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Strong bloom filter (golden light) ── */}
        <filter id="tl-bloom" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Sparkle filter ── */}
        <filter id="tl-spark" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ═══════════════ Master timeline: 20 s ═══════════════ */}
        <style>{`
          /* ── Body: still → spiral collapse (2 rev) → golden regrowth (3rd rev) → still ── */
          @keyframes tl-body {
            0%, 35%   { transform: rotate(0deg)    scale(1);    }
            46%       { transform: rotate(360deg)  scale(0.62); }
            55%, 57%  { transform: rotate(720deg)  scale(0.20); }
            67%       { transform: rotate(1074deg) scale(1.06); }
            70%, 100% { transform: rotate(1080deg) scale(1);    }
          }

          /* ── Purple rest-drop: visible at rest, merges away during collapse ── */
          @keyframes tl-purple {
            0%, 36%   { opacity: 0.95; transform: scale(1);    }
            44%       { opacity: 0;    transform: scale(0.15); }
            45%, 74%  { opacity: 0;    transform: scale(0.15); }
            80%, 100% { opacity: 0.95; transform: scale(1);    }
          }

          /* ── Indigo/dark-turquoise dot: appears as the drops merge ── */
          @keyframes tl-collapse-dot {
            0%, 42%   { opacity: 0;   transform: scale(0.1);  }
            52%, 58%  { opacity: 1;   transform: scale(1);    }
            64%       { opacity: 0.5; transform: scale(1.9);  }
            68%, 100% { opacity: 0;   transform: scale(2.6);  }
          }

          /* ── Golden light: blooms while the logo grows back ── */
          @keyframes tl-gold {
            0%, 54%   { opacity: 0;    transform: scale(0.2); }
            60%       { opacity: 0.95; transform: scale(1);   }
            66%       { opacity: 0.55; transform: scale(1.5); }
            73%, 100% { opacity: 0;    transform: scale(1.8); }
          }
          @keyframes tl-gold-rays {
            0%, 55%   { opacity: 0;   transform: rotate(0deg)  scale(0.3); }
            61%       { opacity: 0.7; transform: rotate(24deg) scale(1);   }
            70%, 100% { opacity: 0;   transform: rotate(48deg) scale(1.35);}
          }

          /* ── Silver shimmer: gloss sweeps across once at the end ── */
          @keyframes tl-shimmer {
            0%, 72%   { transform: translateX(-110px); opacity: 0; }
            73%       { opacity: 0.9; }
            80%       { transform: translateX(110px);  opacity: 0.9; }
            81%, 100% { transform: translateX(110px);  opacity: 0; }
          }

          /* ── Tiny silver sparkles glinting during the shimmer ── */
          @keyframes tl-glint-a {
            0%, 73%, 79%, 100% { opacity: 0; transform: scale(0.2); }
            75.5%              { opacity: 1; transform: scale(1);   }
          }
          @keyframes tl-glint-b {
            0%, 75.5%, 81.5%, 100% { opacity: 0; transform: scale(0.2); }
            78%                    { opacity: 1; transform: scale(1);   }
          }

          /* ── Ambient ring: breathes softly with the golden bloom ── */
          @keyframes tl-ring {
            0%, 100%  { opacity: 0.14; }
            50%, 56%  { opacity: 0.05; }
            61%, 65%  { opacity: 0.55; }
            76%       { opacity: 0.3;  }
          }

          .tl-body {
            animation: tl-body 20s cubic-bezier(0.55, 0.06, 0.28, 0.99) infinite;
            transform-origin: 50px 50px;
          }
          .tl-purple {
            animation: tl-purple 20s ease-in-out infinite;
            transform-origin: 50px 50px;
          }
          .tl-collapse-dot {
            animation: tl-collapse-dot 20s cubic-bezier(0.45, 0.05, 0.45, 0.95) infinite;
            transform-origin: 50px 50px;
          }
          .tl-gold {
            animation: tl-gold 20s ease-out infinite;
            transform-origin: 50px 50px;
          }
          .tl-gold-rays {
            animation: tl-gold-rays 20s ease-out infinite;
            transform-origin: 50px 50px;
          }
          .tl-shimmer {
            animation: tl-shimmer 20s cubic-bezier(0.3, 0, 0.4, 1) infinite;
          }
          .tl-glint-a {
            animation: tl-glint-a 20s ease-in-out infinite;
            transform-origin: 30px 26px;
          }
          .tl-glint-b {
            animation: tl-glint-b 20s ease-in-out infinite;
            transform-origin: 68px 62px;
          }
          .tl-ring { animation: tl-ring 20s ease-in-out infinite; }

          @media (prefers-reduced-motion: reduce) {
            .tl-body, .tl-purple, .tl-collapse-dot, .tl-gold, .tl-gold-rays,
            .tl-shimmer, .tl-glint-a, .tl-glint-b, .tl-ring { animation: none; }
            .tl-collapse-dot, .tl-gold, .tl-gold-rays, .tl-shimmer,
            .tl-glint-a, .tl-glint-b { opacity: 0; }
          }
        `}</style>
      </defs>

      {/* ── Outer ambient ring (does not collapse) ── */}
      <circle
        cx="50" cy="50" r="46.5"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.7"
        className="tl-ring"
      />

      {/* ── BODY — yin-yang that rests, spirals in and regrows ── */}
      <g className="tl-body">
        {/* YANG — green fish, upper-right */}
        <path
          d="M 50,3
             A 23.5,23.5 0 0,1 50,50
             A 23.5,23.5 0 0,0 50,97
             A 47,47    0 0,1 50,3 Z"
          fill="url(#tl-yang)"
        />
        <circle cx="64.5" cy="26.5" r="8.2" fill="url(#tl-yang-eye)" opacity="0.93" />
        <circle cx="64.5" cy="26.5" r="3.9" fill="#1e3ba8"           opacity="0.88" />
        <circle cx="62.3" cy="24.3" r="1.5" fill="white"             opacity="0.55" />

        {/* YIN — blue fish, lower-left */}
        <path
          d="M 50,3
             A 23.5,23.5 0 0,1 50,50
             A 23.5,23.5 0 0,0 50,97
             A 47,47    0 0,0 50,3 Z"
          fill="url(#tl-yin)"
        />
        <circle cx="35.5" cy="73.5" r="8.2" fill="url(#tl-yin-dot)" opacity="0.93" />
        <circle cx="35.5" cy="73.5" r="3.9" fill="#4a8a3f"          opacity="0.88" />
        <circle cx="33.3" cy="71.3" r="1.5" fill="white"            opacity="0.50" />
        <path
          d="M 39,77 Q 35.5,71 31,74.5 Q 28.5,78.5 32,82"
          fill="none" stroke="#c89a4e" strokeWidth="1.2"
          strokeLinecap="round" opacity="0.55"
        />

        {/* S-curve seam */}
        <path
          d="M 50,3 A 23.5,23.5 0 0,1 50,50 A 23.5,23.5 0 0,0 50,97"
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8"
        />

        {/* Purple centre drop — part of the rest state, rotates with the body */}
        <g className="tl-purple" filter="url(#tl-glow)">
          <ellipse cx="50" cy="50" rx="9" ry="11.5"
            fill="url(#tl-purple)"
            transform="rotate(-30 50 50)"
          />
        </g>
      </g>

      {/* ── INDIGO / DARK-TURQUOISE COLLAPSE DOT ── */}
      <g className="tl-collapse-dot" filter="url(#tl-glow)">
        <circle cx="50" cy="50" r="13" fill="url(#tl-collapse)" />
        <circle cx="46" cy="45.5" r="3" fill="#cffafe" opacity="0.5" />
      </g>

      {/* ── GOLDEN LIGHT — bloom + rays while the logo regrows ── */}
      <g className="tl-gold-rays">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="49.3" y="8" width="1.4" height="24" rx="0.7"
            fill="#fcd34d" opacity="0.8"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="34" fill="url(#tl-gold)"
        className="tl-gold" filter="url(#tl-bloom)" />

      {/* ── SILVER SHIMMER — gloss sweep + sparkles, clipped to the orb ── */}
      <g clipPath="url(#tl-clip)">
        <rect x="-10" y="-10" width="120" height="120"
          fill="url(#tl-silver)"
          className="tl-shimmer"
          transform="rotate(18 50 50)"
        />
      </g>
      <g filter="url(#tl-spark)">
        <path className="tl-glint-a" fill="#f1f5f9"
          d="M 30,21 L 31.4,24.6 L 35,26 L 31.4,27.4 L 30,31 L 28.6,27.4 L 25,26 L 28.6,24.6 Z" />
        <path className="tl-glint-b" fill="#e2e8f0"
          d="M 68,57 L 69.2,60 L 72.2,61.2 L 69.2,62.4 L 68,65.4 L 66.8,62.4 L 63.8,61.2 L 66.8,60 Z" />
      </g>
    </svg>
  );
}

export function TrinityOrb({ size = 34, className = '' }: Props) {
  return <TrinityLogo size={size} className={className} />;
}
