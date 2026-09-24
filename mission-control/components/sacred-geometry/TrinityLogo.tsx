"use client";
import { useId } from "react";
interface Props {
  size?: number;
  className?: string;
}
/** A golden third drop joins the separated pair before their violet bloom. */
export function TrinityLogo({ size = 36, className = "" }: Props) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="-15 -15 130 130"
      className={`trinity-living-logo ${className}`}
      role="img"
      aria-label="Trinity – Yin und Yang"
    >
      <defs>
        <radialGradient id={`${id}-green`}>
          <stop stopColor="#daffcd" />
          <stop offset=".5" stopColor="#75bba3" />
          <stop offset="1" stopColor="#245a50" />
        </radialGradient>
        <radialGradient id={`${id}-blue`}>
          <stop stopColor="#acc8ff" />
          <stop offset=".6" stopColor="#5d71bc" />
          <stop offset="1" stopColor="#24395c" />
        </radialGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#fff" />
          <stop offset=".2" stopColor="#edcaff" />
          <stop offset=".55" stopColor="#a457e3" stopOpacity=".7" />
          <stop offset="1" stopColor="#a457e3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff9d8" />
          <stop offset=".25" stopColor="#ffe69a" />
          <stop offset=".48" stopColor="#b97a18" />
          <stop offset=".63" stopColor="#fff2b7" />
          <stop offset="1" stopColor="#cc932b" />
        </linearGradient>
      </defs>
      <g className="trinity-drop-a">
        <path
          d="M50 4 A46 46 0 0 1 50 96 A23 23 0 0 1 50 50 A23 23 0 0 0 50 4"
          fill={`url(#${id}-green)`}
        />
        <circle cx="50" cy="73" r="7" fill="#465da0" />
      </g>
      <g className="trinity-drop-b">
        <path
          d="M50 96 A46 46 0 0 1 50 4 A23 23 0 0 1 50 50 A23 23 0 0 0 50 96"
          fill={`url(#${id}-blue)`}
        />
        <circle cx="50" cy="27" r="7" fill="#95ceb0" />
      </g>
      <g className="trinity-drop-gold">
        <path
          d="M50 20 C47 33 34 43 34 56 A16 16 0 0 0 66 56 C66 43 53 33 50 20Z"
          fill={`url(#${id}-gold)`}
        />
        <path
          d="M47 39 C42 46 39 51 40 56"
          fill="none"
          stroke="#fff9df"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity=".8"
        />
      </g>
      <circle
        className="trinity-bloom"
        cx="50"
        cy="50"
        r="62"
        fill={`url(#${id}-light)`}
      />
      <circle
        className="trinity-ring"
        cx="50"
        cy="50"
        r="37"
        fill="none"
        stroke="#d2a6ff"
        strokeWidth="1.5"
      />
    </svg>
  );
}
export function TrinityOrb(props: Props) {
  return <TrinityLogo {...props} />;
}
