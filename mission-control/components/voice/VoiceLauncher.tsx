"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Mic } from "lucide-react";
export function VoiceLauncher() {
  const path = usePathname(),
    router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyN" && !e.repeat) {
        e.preventDefault();
        if (path === "/notiz")
          window.dispatchEvent(new Event("neo-toggle-recording"));
        else router.push("/notiz?rec=1");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [path, router]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
  }, []);
  if (path === "/notiz" || path.startsWith("/dashboard")) return null;
  return (
    <Link
      href="/notiz"
      title="Sprachnotiz öffnen (Alt+N)"
      aria-label="Sprachnotiz öffnen"
      className="fixed bottom-5 left-5 z-[90] rounded-full bg-forest-800 text-white border border-forest-500 p-3 shadow-lg"
    >
      <Mic size={22} />
    </Link>
  );
}
