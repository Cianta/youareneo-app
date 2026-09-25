"use client";
import { useState } from "react";
const brands: [RegExp, string][] = [
  [/shopify/i, "shopify"],
  [/hubspot/i, "hubspot"],
  [/gohighlevel|ghl/i, "highlevel"],
  [/gmail|google/i, "google"],
  [/whatsapp/i, "whatsapp"],
  [/telegram/i, "telegram"],
  [/riverside/i, "riverside"],
  [/obsidian/i, "obsidian"],
];
export function AppLogo({
  label,
  href = "",
  fallback = "↗",
}: {
  label: string;
  href?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const brand = brands.find(([p]) => p.test(label + " " + href))?.[1];
  return brand && !failed ? (
    <img
      className="s-brand-logo"
      src={`/brands/${brand}.ico`}
      alt=""
      width={24}
      height={24}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="s-app-symbol" aria-hidden>
      {fallback === "↗" ? label.slice(0, 1) : fallback}
    </span>
  );
}
