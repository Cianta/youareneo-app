"use client";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/components/voice/BrandProvider";
import "./avatar.css";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";
const labels: Record<AvatarState, string> = {
  idle: "Bereit",
  listening: "Hört zu",
  thinking: "Denkt",
  speaking: "Spricht",
};

/** Pure presentation: never requests microphone access or starts playback. */
export function AssistantAvatar({
  state = "idle",
  level = 0,
}: {
  state?: AvatarState;
  level?: number;
}) {
  const { assistantName } = useBrand();
  const path = usePathname();
  const intensity = Number.isFinite(level)
    ? Math.max(0, Math.min(1, level))
    : 0;
  return (
    <Link
      href="/sprechen"
      prefetch={false}
      className="assistant-avatar"
      data-state={state}
      style={{ "--voice-level": intensity } as CSSProperties}
      aria-label={`${assistantName}: ${labels[state]}. Sprachchat öffnen`}
      title={`Mit ${assistantName} sprechen`}
      onClick={(event) => {
        // Preserve the current conversation; focus its composer on repeated clicks.
        if (
          path === "/sprechen" &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          document.getElementById("chat-text")?.focus();
        }
      }}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle
            className="avatar-orbit"
            cx="32"
            cy="30"
            r="27"
            strokeWidth=".8"
            strokeDasharray="3 5 18 5"
          />
          <g className="avatar-energy" strokeWidth="1.2">
            <path d="M22 26c-6-14 26-14 20 0l-3 12c-3 6-11 6-14 0z" />
            <path d="M25 40C16 43 12 48 10 56M39 40c9 3 13 8 15 16M18 52c9-8 19-8 28 0M23 55c6-4 12-4 18 0" />
            <path
              d="M28 18c-4 8-4 15 0 22M36 18c4 8 4 15 0 22M23 25c6-3 12-3 18 0M24 32c5 2 11 2 16 0"
              opacity=".5"
            />
            <path d="M14 21c-4 6-4 12-1 17M50 21c4 6 4 12 1 17" opacity=".6" />
          </g>
          <path
            className="avatar-voice"
            d="M25 34h3l2-3 3 6 3-3h3"
            strokeWidth="1.5"
          />
        </g>
      </svg>
      <span aria-hidden="true">{labels[state]}</span>
    </Link>
  );
}
