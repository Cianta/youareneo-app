"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const AssistantDock = dynamic(() => import("@/components/assistant/AssistantDock"));
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
  return <AssistantDock />;
}
