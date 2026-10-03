'use client';
import {useId} from 'react';
import { useBrand } from '@/components/voice/BrandProvider';

/**
 * A quiet 20-second cycle: the original yin-yang gathers into a point,
 * Trinity's violet sun opens with independent plasma/corona motion,
 * then the mark returns. The photosphere is a real alpha-transparent PNG;
 * filaments, prominences and active-region light are separate SVG layers.
 * No canvas, 3D runtime or frame-by-frame React updates. Motion can be disabled.
 */

interface Props {
  size?: number;
  className?: string;
}

export function TrinityLogo({ size = 36, className = '' }: Props) {
  const prefix=useId().replace(/:/g, "");
  const {appName} = useBrand();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ overflow: 'visible' }}
      aria-label={`${appName} — YOU ARE NEO`}
    >
      <defs>
        {/* ── Green (yang) gradient ── */}
        <radialGradient id={`${prefix}-tl-yang`} gradientUnits="userSpaceOnUse" cx="63" cy="26" r="46">
          <stop offset="0%"   stopColor="#d8f4a8" />
          <stop offset="26%"  stopColor="#6bbf40" />
          <stop offset="62%"  stopColor="#4a8a3f" />
          <stop offset="100%" stopColor="#2a5228" />
        </radialGradient>

        {/* ── Blue (yin) gradient ── */}
        <radialGradient id={`${prefix}-tl-yin`} gradientUnits="userSpaceOnUse" cx="37" cy="74" r="46">
          <stop offset="0%"   stopColor="#8aabf5" />
          <stop offset="28%"  stopColor="#3355cc" />
          <stop offset="65%"  stopColor="#1e3ba8" />
          <stop offset="100%" stopColor="#0b1840" />
        </radialGradient>

        {/* ── Yang eye (blue on green half) ── */}
        <radialGradient id={`${prefix}-tl-yang-eye`} cx="45%" cy="33%" r="60%">
          <stop offset="0%"   stopColor="#e8f0ff" />
          <stop offset="38%"  stopColor="#5588ff" />
          <stop offset="100%" stopColor="#1530a8" />
        </radialGradient>

        {/* ── Yin dot (green on blue half) ── */}
        <radialGradient id={`${prefix}-tl-yin-dot`} cx="40%" cy="33%" r="65%">
          <stop offset="0%"   stopColor="#eeffcc" />
          <stop offset="36%"  stopColor="#7acc44" />
          <stop offset="100%" stopColor="#2a5228" />
        </radialGradient>

        {/* ── Purple centre drop (rest state) ── */}
        <radialGradient id={`${prefix}-tl-purple`} cx="50%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="18%"  stopColor="#ede9fe" />
          <stop offset="52%"  stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b0764" stopOpacity="0.65" />
        </radialGradient>

        {/* ── Indigo → dark-turquoise collapse dot ── */}
        <radialGradient id={`${prefix}-tl-collapse`} cx="42%" cy="36%" r="70%">
          <stop offset="0%"   stopColor="#a5f3fc" />
          <stop offset="30%"  stopColor="#22d3ee" />
          <stop offset="60%"  stopColor="#155e75" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>

        <radialGradient id={`${prefix}-tl-corona`}>
          <stop offset="48%" stopColor="#c084fc" stopOpacity="0" />
          <stop offset="65%" stopColor="#e9b9ff" stopOpacity="0.5" />
          <stop offset="77%" stopColor="#a855f7" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${prefix}-tl-active`}>
          <stop stopColor="#fff3ff" stopOpacity="0.95" />
          <stop offset="30%" stopColor="#e9a8ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#b15aff" stopOpacity="0" />
        </radialGradient>

        {/* ── Silver gloss sweep ── */}
        <linearGradient id={`${prefix}-tl-silver`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
          <stop offset="42%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%"  stopColor="#f8fafc" stopOpacity="0.85" />
          <stop offset="58%"  stopColor="#cbd5e1" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Clip for the shimmer sweep — stays inside the orb */}
        <clipPath id={`${prefix}-tl-clip`}>
          <circle cx="50" cy="50" r="47" />
        </clipPath>

        {/* ── Soft glow filter ── */}
        <filter id={`${prefix}-tl-glow`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ── Sparkle filter ── */}
        <filter id={`${prefix}-tl-spark`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ═══════════════ Master timeline: 20 s ═══════════════ */}
        <style>{`
          /* ── Body: still → spiral collapse (2 rev) → violet regrowth (3rd rev) → still ── */
          @keyframes tl-body {
            0%, 35%   { transform: rotate(0deg)    scale(1); opacity:1; }
            46%       { transform: rotate(360deg)  scale(0.62); }
            55%, 57%  { transform: rotate(720deg)  scale(0.20); opacity:0.02; }
            67%       { transform: rotate(1074deg) scale(1.06); opacity:0.04; }
            74%, 100% { transform: rotate(1080deg) scale(1); opacity:1; }
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

          /* Solar emergence belongs to the master cycle; its surface lives independently. */
          @keyframes tl-sun-stage {
            0%, 48% { opacity:0; transform:scale(.12); }
            54% { opacity:.65; transform:scale(.38); }
            59%, 66% { opacity:1; transform:scale(1); }
            69% { opacity:.8; transform:scale(1.03); }
            74%, 100% { opacity:0; transform:scale(.82); }
          }
          @keyframes tl-sun-surface {
            0%, 48% { transform:rotate(-14deg); }
            74%, 100% { transform:rotate(14deg); }
          }
          @keyframes tl-corona-breathe {
            0%,100% { opacity:.38; transform:scale(.94); }
            50% { opacity:.78; transform:scale(1.08); }
          }
          @keyframes tl-plasma-flow { to { stroke-dashoffset:-70; } }
          @keyframes tl-prominence {
            0%,100% { opacity:.15; transform:scaleY(.75); }
            50% { opacity:.72; transform:scaleY(1.12); }
          }
          @keyframes tl-active-pulse {
            0%,100% { opacity:.2; transform:scale(.6); }
            45% { opacity:.85; transform:scale(1.08); }
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

          /* ── Ambient ring: breathes softly with the violet bloom ── */
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
          .tl-sun-stage { animation:tl-sun-stage 20s cubic-bezier(.22,.7,.25,1) infinite; transform-origin:50px 50px; }
          .tl-sun-surface { animation:tl-sun-surface 20s ease-in-out infinite; transform-origin:50px 50px; }
          .tl-sun-corona { animation:tl-corona-breathe 5s ease-in-out infinite; transform-origin:50px 50px; }
          .tl-sun-filament { animation:tl-plasma-flow 9s linear infinite; stroke-dasharray:12 23; }
          .tl-sun-prominence { animation:tl-prominence 5.5s ease-in-out infinite; transform-origin:50px 17px; }
          .tl-sun-active { animation:tl-active-pulse 4.5s ease-in-out infinite; transform-box:fill-box; transform-origin:center; }
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
            .tl-body, .tl-purple, .tl-collapse-dot, .tl-sun-stage, .tl-sun-stage *,
            .tl-shimmer, .tl-glint-a, .tl-glint-b, .tl-ring { animation: none; }
            .tl-collapse-dot, .tl-sun-stage, .tl-sun-stage *, .tl-shimmer,
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
          fill={`url(#${prefix}-tl-yang)`}
        />
        <circle cx="64.5" cy="26.5" r="8.2" fill={`url(#${prefix}-tl-yang-eye)`} opacity="0.93" />
        <circle cx="64.5" cy="26.5" r="3.9" fill="#1e3ba8"           opacity="0.88" />
        <circle cx="62.3" cy="24.3" r="1.5" fill="white"             opacity="0.55" />

        {/* YIN — blue fish, lower-left */}
        <path
          d="M 50,3
             A 23.5,23.5 0 0,1 50,50
             A 23.5,23.5 0 0,0 50,97
             A 47,47    0 0,0 50,3 Z"
          fill={`url(#${prefix}-tl-yin)`}
        />
        <circle cx="35.5" cy="73.5" r="8.2" fill={`url(#${prefix}-tl-yin-dot)`} opacity="0.93" />
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
        <g className="tl-purple" filter={`url(#${prefix}-tl-glow)`}>
          <ellipse cx="50" cy="50" rx="9" ry="11.5"
            fill={`url(#${prefix}-tl-purple)`}
            transform="rotate(-30 50 50)"
          />
        </g>
      </g>

      {/* ── INDIGO / DARK-TURQUOISE COLLAPSE DOT ── */}
      <g className="tl-collapse-dot" filter={`url(#${prefix}-tl-glow)`}>
        <circle cx="50" cy="50" r="13" fill={`url(#${prefix}-tl-collapse)`} />
        <circle cx="46" cy="45.5" r="3" fill="#cffafe" opacity="0.5" />
      </g>

      {/* Transparent photosphere + independently moving solar plasma, not a logo card. */}
      <g className="tl-sun-stage" data-trinity-sun="layered" aria-hidden="true">
        <circle className="tl-sun-corona" cx="50" cy="50" r="48" fill={`url(#${prefix}-tl-corona)`}/>
        <g className="tl-sun-surface">
          <image href="/_next/image?url=%2Fpwa%2Ftrinity-sun-transparent.png&w=96&q=75" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>
          <g fill="none" stroke="#efb8ff" strokeWidth="0.55" strokeLinecap="round">
            {[0,60,125,195,255,310].map((angle,i)=><g key={angle} transform={`rotate(${angle} 50 50)`}>
              <path className="tl-sun-prominence" style={{animationDelay:`${-i*.75}s`}} d="M 43,18 C 39,7 51,4 57,17 C 54,12 45,11 43,18"/>
            </g>)}
            <path className="tl-sun-filament" d="M 23,48 C 28,34 40,40 39,27 C 43,18 55,31 55,40 C 56,52 75,43 77,55" opacity=".65"/>
            <path className="tl-sun-filament" style={{animationDelay:'-4s'}} d="M 33,69 C 46,80 47,59 55,66 C 63,74 74,67 69,55" opacity=".5"/>
          </g>
          <circle className="tl-sun-active" cx="63" cy="43" r="8" fill={`url(#${prefix}-tl-active)`}/>
          <circle className="tl-sun-active" style={{animationDelay:'-2.4s'}} cx="30" cy="53" r="5" fill={`url(#${prefix}-tl-active)`}/>
        </g>
      </g>

      {/* ── SILVER SHIMMER — gloss sweep + sparkles, clipped to the orb ── */}
      <g clipPath={`url(#${prefix}-tl-clip)`}>
        <rect x="-10" y="-10" width="120" height="120"
          fill={`url(#${prefix}-tl-silver)`}
          className="tl-shimmer"
          transform="rotate(18 50 50)"
        />
      </g>
      <g filter={`url(#${prefix}-tl-spark)`}>
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
