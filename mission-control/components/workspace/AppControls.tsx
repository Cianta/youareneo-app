"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { mobileTabs } from "@/lib/workspace/navigation";
import { isEditing } from "@/lib/workspace/search";
import { Dialog } from "./Dialog";
const Palette = dynamic(() => import("./CommandPalette"), { ssr: false });
export function AppControls() {
  const path = usePathname();
  const enabled = path.startsWith("/dashboard") || path === "/notiz";
  const [palette, setPalette] = useState(false),
    [help, setHelp] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHelp(false);
        setPalette((p) => !p);
      }
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditing(e.target)
      ) {
        e.preventDefault();
        setPalette(false);
        setHelp(true);
      }
    };
    const open = () => setPalette(true);
    const shortcuts = () => setHelp(true);
    window.addEventListener("keydown", key);
    window.addEventListener("neo-open-search", open);
    window.addEventListener("neo-open-help", shortcuts);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("neo-open-search", open);
      window.removeEventListener("neo-open-help", shortcuts);
    };
  }, [enabled]);
  useEffect(() => {
    setPalette(false);
    setHelp(false);
  }, [path]);
  if (!enabled) return null;
  return (
    <>
      {palette && <Palette onClose={() => setPalette(false)} />}
      {help && (
        <Dialog title="Tastenkürzel & Hilfe" onClose={() => setHelp(false)}>
          <dl className="shortcut-list">
            <dt>⌘K / Ctrl+K</dt>
            <dd>Seiten, Aktionen und eigene Inhalte suchen</dd>
            <dt>Alt+N</dt>
            <dd>Sprachnotiz öffnen; im Notizraum Aufnahme umschalten</dd>
            <dt>?</dt>
            <dd>Diese Hilfe öffnen (außerhalb von Eingabefeldern)</dd>
            <dt>Esc</dt>
            <dd>Dialog schließen</dd>
            <dt>↑ / ↓ · Enter</dt>
            <dd>In der Suche auswählen und öffnen</dd>
          </dl>
          <Link
            href="/notiz/hilfe"
            onClick={() => setHelp(false)}
            className="workspace-button"
          >
            Installation auf dem Handy
          </Link>
        </Dialog>
      )}
      <nav
        className="workspace-mobile-tabs"
        aria-label="Mobile Hauptnavigation"
      >
        {mobileTabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={
              path === t.href ||
              (t.id === "more" &&
                path.startsWith("/dashboard/") &&
                path !== "/dashboard/vision/tasks")
                ? "page"
                : undefined
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
